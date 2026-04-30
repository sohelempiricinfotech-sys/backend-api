import { AppDataSource } from "../data-source";
import { User } from "../module/users/user.model";
import { CandidateData } from "../module/candidate-data/candidate-data.model";
import { Submission } from "../module/submissions/submission.model";
import { JobPost } from "../module/job/job.model";
import { getSmtpSettings } from "../module/smtp-settings/smtp-settings.services";
import { buildEmailShell } from "./email-template";
import { publishEmail, EmailPriority } from "./email-publisher";
import { In, IsNull } from "typeorm";
import { incrementCandidateEmailCount } from "../elastic-index/candidate/candidate.operation";
import { incrementSubmissionEmailCount } from "../elastic-index/submission/submission.operation";
import { marked } from "marked";
import {
  bulkCreateCandidateEmailHistory,
  bulkCreateSubmissionEmailHistory,
} from "../module/email-history/email-history.services";
import {
  CreateCandidateEmailHistoryInput,
  CreateSubmissionEmailHistoryInput,
} from "../module/email-history/email-history.type";

// Configure marked: single line breaks become <br>
marked.setOptions({ breaks: true });

const userRepository = AppDataSource.getRepository(User);
const candidateDataRepository = AppDataSource.getRepository(CandidateData);
const submissionRepository = AppDataSource.getRepository(Submission);
const jobRepository = AppDataSource.getRepository(JobPost);

interface JobPlaceholderData {
  interviewer: { name: string; email: string; phone: string } | null;
  branch: { name: string; location: string; email: string; phone: string } | null;
}

interface SendEmailToUsersInput {
  userIds: number[];
  userId: number;
  orgId: number;
  subject: string;
  body: string;
  replyTo?: string;
  linkName?: string;
  linkUrl?: string;
  incUserEmailCount: boolean;
  jobData?: JobPlaceholderData | null;
}

/**
 * Replace placeholder tokens in subject/body with candidate / job info.
 *
 * Supported placeholders:
 *   $name             — Candidate full name
 *   $user             — Sender (employee) full name
 *   $mobile           — Candidate phone
 *   $email            — Candidate email
 *   $interviewer      — Job interviewer full name
 *   $interviewerphone — Job interviewer phone
 *   $intervieweremail — Job interviewer email
 *   $branchname       — Job branch name
 *   $branchlocation   — Job branch location (address, city, state, country)
 *   $branchemail      — Job branch email
 *   $branchphone      — Job branch phone
 *
 * NOTE: Order matters — replace longer placeholders that share a prefix with
 * shorter ones first (e.g. $intervieweremail before $interviewer).
 */
function replacePlaceholders(
  text: string,
  candidate: { name: string; email: string; phone: string | null },
  senderName: string,
  jobData?: JobPlaceholderData | null
): string {
  return text
    // Job placeholders (longest-prefix first to avoid partial matches)
    .replace(/\$intervieweremail/g, jobData?.interviewer?.email || "")
    .replace(/\$interviewerphone/g, jobData?.interviewer?.phone || "")
    .replace(/\$interviewer/g, jobData?.interviewer?.name || "")
    .replace(/\$branchlocation/g, jobData?.branch?.location || "")
    .replace(/\$branchname/g, jobData?.branch?.name || "")
    .replace(/\$branchemail/g, jobData?.branch?.email || "")
    .replace(/\$branchphone/g, jobData?.branch?.phone || "")
    // Candidate / sender placeholders
    .replace(/\$name/g, candidate.name)
    .replace(/\$user/g, senderName)
    .replace(/\$mobile/g, candidate.phone || "")
    .replace(/\$email/g, candidate.email);
}

/**
 * Fetch a job and build the placeholder payload (interviewer + branch).
 * Returns null if the job is not found in the org.
 */
async function buildJobPlaceholderData(
  jobId: string,
  orgId: number
): Promise<JobPlaceholderData | null> {
  const job = await jobRepository.findOne({
    where: {
      id: jobId,
      org_id: orgId,
      deleted_at: IsNull(),
    },
    relations: ["branch", "interviewer"],
  });

  if (!job) return null;

  let interviewer: JobPlaceholderData["interviewer"] = null;
  if (job.interviewer) {
    const fullName = `${job.interviewer.first_name || ""} ${job.interviewer.last_name || ""}`.trim();
    interviewer = {
      name: fullName,
      email: job.interviewer.email || "",
      phone: job.interviewer.phone || "",
    };
  }

  let branch: JobPlaceholderData["branch"] = null;
  if (job.branch) {
    const location = [
      job.branch.address_line_1,
      job.branch.city,
      job.branch.state,
      job.branch.country,
    ]
      .filter(Boolean)
      .join(", ");
    branch = {
      name: job.branch.branch_name || "",
      location,
      email: job.branch.email || "",
      phone: job.branch.phone || "",
    };
  }

  return { interviewer, branch };
}

/**
 * Send email to a list of users (candidates) with placeholder replacement.
 * Queues each email individually so per-candidate personalization works.
 * Increments email_send_count on candidate_data in PG + ES.
 */
export async function sendEmailToUsers(
  input: SendEmailToUsersInput
): Promise<void> {
  const { userIds, userId, orgId, subject, body, replyTo, linkName, linkUrl, incUserEmailCount, jobData } = input;

  // Fetch SMTP settings for the org
  const smtpSettings = await getSmtpSettings(orgId);
  if (!smtpSettings) {
    throw new Error(`No SMTP settings configured for org ${orgId}`);
  }

  // Fetch sender (employee) info
  const sender = await userRepository.findOneBy({ id: userId, org_id: orgId });
  if (!sender) {
    throw new Error("Sender user not found");
  }
  const senderName = `${sender.first_name || ""} ${sender.last_name || ""}`.trim();

  // Fetch all target users in one query
  const users = await userRepository.find({
    where: { id: In(userIds), org_id: orgId, deleted_at: IsNull() },
    select: ["id", "first_name", "last_name", "email", "phone"],
  });

  if (users.length === 0) {
    return;
  }

  // Build email shell once (org branding)
  const shell = await buildEmailShell(orgId);

  const smtp = {
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.secure,
    username: smtpSettings.username,
    password: smtpSettings.password,
  };

  const sentUserIds: number[] = [];
  const failed: { user_id: number; reason: string }[] = [];

  // Track which user IDs we found vs not found
  const foundUserIdSet = new Set(users.map((u) => u.id));
  for (const uid of userIds) {
    if (!foundUserIdSet.has(uid)) {
      failed.push({ user_id: uid, reason: "User not found" });
    }
  }

  // Queue an email for each candidate
  for (const user of users) {
    const candidateName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const candidate = {
      name: candidateName,
      email: user.email,
      phone: user.phone,
    };

    const personalizedSubject = replacePlaceholders(subject, candidate, senderName, jobData);
    const personalizedBody = replacePlaceholders(body, candidate, senderName, jobData);

    // Convert markdown to HTML (breaks: true makes single newlines become <br>)
    let bodyHtml = marked.parse(personalizedBody) as string;

    if (linkName && linkUrl) {
      bodyHtml += `
        <div style="text-align:center;margin-top:20px;">
          <a href="${linkUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">${linkName}</a>
        </div>`;
    }

    const html = shell.replace("__body__", bodyHtml);

    try {
      await publishEmail(
        {
          to: user.email,
          subject: personalizedSubject,
          html,
          from_email: smtpSettings.from_email,
          from_name: smtpSettings.from_name ?? undefined,
          reply_to: replyTo,
          smtp,
        },
        EmailPriority.NORMAL
      );
      sentUserIds.push(user.id);
    } catch (err: any) {
      failed.push({ user_id: user.id, reason: err.message });
    }
  }

  // Increment email_send_count in PG (candidate_data) + ES
  if (sentUserIds.length > 0 && incUserEmailCount) {
    await candidateDataRepository
      .createQueryBuilder()
      .update(CandidateData)
      .set({ email_send_count: () => "email_send_count + 1" })
      .where("user_id IN (:...userIds) AND org_id = :orgId", {
        userIds: sentUserIds,
        orgId,
      })
      .execute();

    // Sync ES candidate index
    incrementCandidateEmailCount(orgId, sentUserIds);

    // Record candidate email history
    try {
      const historyRecords: CreateCandidateEmailHistoryInput[] = sentUserIds.map((uid) => ({
        org_id: orgId,
        user_id: uid,
        sender_id: userId,
        subject,
        body,
        reply_to: replyTo || null,
        link_name: linkName || null,
        link_url: linkUrl || null,
      }));
      await bulkCreateCandidateEmailHistory(historyRecords);
    } catch (err) {
      console.error("Failed to record candidate email history:", err);
    }
  }

  return;
}

/**
 * Send email to candidates via their submission IDs.
 * Requires jobId to resolve job-scoped placeholders (interviewer / branch).
 * Finds the associated user_id from each submission, then delegates to sendEmailToUsers.
 * Also increments email_send_count on the submission records + ES.
 */
export async function sendEmailBySubmissionIds(input: {
  submissionIds: number[];
  jobId: string;
  userId: number;
  orgId: number;
  subject: string;
  body: string;
  replyTo?: string;
  linkName?: string;
  linkUrl?: string;
}): Promise<void> {
  const { submissionIds, jobId, userId, orgId, subject, body, replyTo, linkName, linkUrl } = input;

  // Fetch submissions to get user_ids
  const submissions = await submissionRepository.find({
    where: {
      id: In(submissionIds),
      org_id: orgId,
      deleted_at: IsNull(),
    },
    select: ["id", "user_id"],
  });

  if (submissions.length === 0) {
    return;
  }

  const submissionsUserId = submissions.map((s) => s.user_id as number);

  // Resolve job-level placeholder data (interviewer + branch) once for the batch
  const jobData = await buildJobPlaceholderData(jobId, orgId);

  // Send emails using the shared function
  await sendEmailToUsers({
    userIds: submissionsUserId,
    userId,
    orgId,
    subject,
    body,
    replyTo,
    linkName,
    linkUrl,
    incUserEmailCount: false,
    jobData,
  });

  // Increment email_send_count on submissions in PG + ES
  if (submissionIds.length > 0) {
    await submissionRepository
      .createQueryBuilder()
      .update(Submission)
      .set({ email_send_count: () => "email_send_count + 1" })
      .where("id IN (:...ids) AND org_id = :orgId", {
        ids: submissionIds,
        orgId,
      })
      .execute();

    incrementSubmissionEmailCount(orgId, submissionIds);

    // Record submission email history
    try {
      const historyRecords: CreateSubmissionEmailHistoryInput[] = submissions.map((s) => ({
        org_id: orgId,
        submission_id: s.id,
        sender_id: userId,
        subject,
        body,
        reply_to: replyTo || null,
        link_name: linkName || null,
        link_url: linkUrl || null,
      }));
      await bulkCreateSubmissionEmailHistory(historyRecords);
    } catch (err) {
      console.error("Failed to record submission email history:", err);
    }
  }

  return;
}
