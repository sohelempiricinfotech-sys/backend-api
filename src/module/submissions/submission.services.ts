import { Submission } from "./submission.model";
import { AppDataSource } from "../../data-source";
import { CreateSubmissionInput } from "./submission.type";
import { IsNull } from "typeorm";
import { User } from "../users/user.model";
import { getFileUrl, getProfilePhotoSignedUrl } from "../../utility/s3";
import { getQuestionsByJobId } from "../questions/question.services";
import { getPipelineStatusByJobId, adjustStatusCounts } from "../submission-statuses/submission-status.services";
import { In } from "typeorm";
import { bulkAddSubmissionIndex, bulkUpdateSubmissionStatus as esBulkUpdateSubmissionStatus, updateSubmissionUnread as esUpdateSubmissionUnread, updateSubmissionJoinedByCandidate as esUpdateSubmissionJoinedByCandidate } from "../../elastic-index/submission/submission.operation";
import { updateJobApplicantCounts } from "../../elastic-index/job/job.operation";
import { updateCandidateJoined as esUpdateCandidateJoined } from "../../elastic-index/candidate/candidate.operation";
import { CandidateData } from "../candidate-data/candidate-data.model";
import { StatusType } from "../submission-statuses/submission-status.model";
import { searchSubmissions, SubmissionFilterOptions } from "../../elastic-index/submission/submission.get";
import { SubmissionDocument } from "../../elastic-index/submission/submission.mapping";
import { searchCandidates, CandidateFilterOptions } from "../../elastic-index/candidate/candidate.get";
import { SubmissionStatus } from "../submission-statuses/submission-status.model";

const submissionRepository = AppDataSource.getRepository(Submission);

const createSubmission = async (data: CreateSubmissionInput) => {
  const submission = submissionRepository.create(data);
  return submissionRepository.save(submission);
};

const getSubmissionByUserAndJob = async (
  userId: number,
  jobId: string,
  orgId: number
) => {
  return submissionRepository.findOneBy({
    user_id: userId,
    job_id: jobId,
    org_id: orgId,
    deleted_at: IsNull(),
  });
};

const getSubmission = async (filter: object) => {
  return submissionRepository.findOneBy(filter);
};

const getSubmissions = async (filter: object) => {
  return submissionRepository.find({ where: filter });
};

const calculateAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const normalizeDisplayName = (value: string | null | undefined): string =>
  (value ?? "").trim();

interface GetSubmissionsListOptions {
  search_after?: (string | number)[];
  limit: number;
  jobId: string;
  statusId?: number;
  search?: string;
  gender?: string;
  industryId?: number;
  sourceId?: number;
  skillIds?: number[];
  minExperience?: number;
  maxExperience?: number;
  minExpectedCtc?: number;
  maxExpectedCtc?: number;
  city?: string;
  state?: string;
  country?: string;
  recruiterId?: number;
  createdById?: number;
  uniqueSubmissionId?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

const getSubmissionsListFromES = async (orgId: number, options: GetSubmissionsListOptions) => {
  const filterOptions: SubmissionFilterOptions = {
    org_id: orgId,
    job_id: options.jobId,
    search_after: options.search_after,
    limit: options.limit,
    search: options.search,
    status_id: options.statusId,
    gender: options.gender,
    industry_id: options.industryId,
    source_id: options.sourceId,
    skill_ids: options.skillIds,
    experience_years_min: options.minExperience,
    experience_years_max: options.maxExperience,
    expected_ctc_min: options.minExpectedCtc,
    expected_ctc_max: options.maxExpectedCtc,
    city: options.city,
    state: options.state,
    country: options.country,
    recruiter_user_id: options.recruiterId,
    created_by_id: options.createdById,
    unique_submission_id: options.uniqueSubmissionId,
    sort_by: options.sort_by,
    sort_order: options.sort_order,
  };

  const result = await searchSubmissions(filterOptions);
  const esResult = result as { data: SubmissionDocument[]; total: number; hasMore: boolean; last_sort: (string | number)[] | null };

  // Fetch candidate note counts in one PG query for all candidates in this page.
  // Submission row's note count = number of notes on the underlying candidate (user_notes).
  const candidateIds = esResult.data.map((d) => d.user_id).filter((id): id is number => id != null);
  const noteCountByCandidateId = new Map<number, number>();
  if (candidateIds.length > 0) {
    const counts = await AppDataSource
      .createQueryBuilder()
      .select("n.user_id", "user_id")
      .addSelect("COUNT(*)", "count")
      .from("user_notes", "n")
      .where("n.user_id IN (:...candidateIds)", { candidateIds })
      .andWhere("n.org_id = :org_id", { org_id: orgId })
      .andWhere("n.deleted_at IS NULL")
      .groupBy("n.user_id")
      .getRawMany();
    for (const row of counts) {
      noteCountByCandidateId.set(parseInt(row.user_id, 10), parseInt(row.count, 10));
    }
  }

  const submissions = await Promise.all(
    esResult.data.map(async (doc) => {
      let profile_photo_url: string | null = null;
      try {
        if (doc.user_id) profile_photo_url = await getProfilePhotoSignedUrl(doc.user_id);
      } catch {
        profile_photo_url = null;
      }

      let recruiter_profile_photo_url: string | null = null;
      try {
        if (doc.recruiter_user_id) recruiter_profile_photo_url = await getProfilePhotoSignedUrl(doc.recruiter_user_id);
      } catch {
        recruiter_profile_photo_url = null;
      }

      let created_by_profile_photo_url: string | null = null;
      try {
        if (doc.created_by_id) created_by_profile_photo_url = await getProfilePhotoSignedUrl(doc.created_by_id);
      } catch {
        created_by_profile_photo_url = null;
      }

      let updated_by_profile_photo_url: string | null = null;
      try {
        if (doc.updated_by_id) updated_by_profile_photo_url = await getProfilePhotoSignedUrl(doc.updated_by_id);
      } catch {
        updated_by_profile_photo_url = null;
      }

      return {
        id: doc.id,
        unique_submission_id: doc.unique_submission_id,
        user_id: doc.user_id,
        submission_status_id: doc.status_id,
        status_name: doc.status_name,
        full_name: normalizeDisplayName(doc.full_name),
        email: doc.email,
        phone: doc.phone,
        profile_photo_url,
        designation: doc.designation,
        experience_years: doc.experience_years,
        notice_period: doc.notice_period,
        expected_ctc: doc.expected_ctc,
        gender: doc.gender,
        date_of_birth: doc.date_of_birth,
        age: calculateAge(doc.date_of_birth),
        linkedin_url: doc.linkedin_url,
        skills: doc.skill_names,
        industry_name: doc.industry_name,
        industry_id: doc.industry_id,
        city: doc.city,
        state: doc.state,
        country: doc.country,
        source_name: doc.source_name,
        recruiter_name: doc.recruiter_name,
        recruiter_profile_photo_url,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        created_by_name: doc.created_by_name,
        updated_by_name: doc.updated_by_name,
        created_by_profile_photo_url,
        updated_by_profile_photo_url,
        email_send_count: doc.email_send_count,
        note_count: doc.user_id != null ? (noteCountByCandidateId.get(doc.user_id) ?? 0) : 0,
        joined: doc.joined ?? false,
        unread: doc.unread,
      };
    })
  );

  return {
    submissions,
    total: esResult.total,
    hasMore: esResult.hasMore,
    last_sort: esResult.last_sort,
  };
};

const getSubmissionById = async (id: number, orgId: number) => {
  return submissionRepository.findOneBy({
    id,
    org_id: orgId,
    deleted_at: IsNull(),
  });
};

interface QnAItem {
  question_id: number;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  answer: any;
  file_url?: string;
}

interface SubmissionQnAResponse {
  questions: QnAItem[];
  expected_ctc: string | null;
}

const getSubmissionQnA = async (submissionId: number, orgId: number): Promise<SubmissionQnAResponse> => {
  const submission = await submissionRepository.findOneBy({
    id: submissionId,
    org_id: orgId,
    deleted_at: IsNull(),
  });

  if (!submission || !submission.job_id) {
    return { questions: [], expected_ctc: null };
  }

  const questionsAnswers = submission.questions_answers || {};
  const questions = await getQuestionsByJobId(submission.job_id, orgId);

  const qnaItems: QnAItem[] = await Promise.all(
    questions.map(async (question) => {
      const answer = questionsAnswers[question.id] ?? null;
      const item: QnAItem = {
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options || null,
        is_required: question.is_required,
        answer,
      };

      // Generate signed URL for file-type answers
      if (question.question_type === "file" && answer?.file_path) {
        try {
          item.file_url = await getFileUrl(answer.file_path);
        } catch {
          item.file_url = undefined;
        }
      }

      return item;
    })
  );

  return { questions: qnaItems, expected_ctc: submission.expected_ctc || null };
};

const updateSubmission = async (
  id: number,
  orgId: number,
  updatedBy: number,
  data: { questions_answers?: Record<string, any>; expected_ctc?: string | null }
) => {
  const submission = await submissionRepository.findOneBy({
    id,
    org_id: orgId,
    deleted_at: IsNull(),
  });

  if (!submission) {
    return null;
  }

  const updateFields: Record<string, any> = { updated_by: updatedBy };

  if (data.questions_answers !== undefined) {
    updateFields.questions_answers = data.questions_answers;
  }
  if (data.expected_ctc !== undefined) {
    updateFields.expected_ctc = data.expected_ctc;
  }

  await submissionRepository.update({ id, org_id: orgId }, updateFields);

  return submissionRepository.findOneBy({ id, org_id: orgId });
};

const userRepository = AppDataSource.getRepository(User);

const bulkSubmitCandidates = async (
  orgId: number,
  jobId: string,
  userIds: number[],
  createdBy: number
) => {
  const pipelineStatus = await getPipelineStatusByJobId(jobId, orgId);
  if (!pipelineStatus) {
    throw new Error("Job configuration error: no pipeline (longlist) status found");
  }

  let submissionCount = await submissionRepository.count({ where: { org_id: orgId } });
  const skippedUserIds: number[] = [];
  const createdSubmissionIds: number[] = [];

  for (const userId of userIds) {
    const existing = await getSubmissionByUserAndJob(userId, jobId, orgId);
    if (existing) {
      skippedUserIds.push(userId);
      continue;
    }

    submissionCount++;
    const uniqueSubmissionId = `SUB-${userId}-${String(submissionCount).padStart(4, "0")}`;

    // TODO:: validate user, user exist on org
    // Priority:: Low

    const s = await createSubmission({
      org_id: orgId,
      user_id: userId,
      job_id: jobId,
      submission_status_id: pipelineStatus.id,
      recruiter_user_id: createdBy,
      source_id: null,
      unique_submission_id: uniqueSubmissionId,
      questions_answers: null,
      expected_ctc: null,
      offer_ctc: null,
      notice_period: null,
      availability: null,
      resume_id: null,
      resume_path: null,
      submission_date_at: new Date().toISOString(),
      updated_date: null,
      created_by: createdBy,
      updated_by: null,
      deleted_by: null,
    });
    createdSubmissionIds.push(s.id);
  }

  // Adjust status count for the pipeline (longlist) status
  if (createdSubmissionIds.length > 0) {
    await adjustStatusCounts({ [pipelineStatus.id]: createdSubmissionIds.length }, orgId);
    updateJobApplicantCounts(jobId, orgId);
  }

  // Bulk index all created submissions in one ES request
  if (createdSubmissionIds.length > 0) {
    bulkAddSubmissionIndex(createdSubmissionIds, orgId);
  }

  // Get names for skipped users
  let skipped: { user_id: number; name: string }[] = [];
  if (skippedUserIds.length > 0) {
    const skippedUsers = await userRepository.find({
      where: { id: In(skippedUserIds), org_id: orgId },
      select: ["id", "first_name", "last_name"],
    });
    skipped = skippedUsers.map((u) => ({
      user_id: u.id,
      name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
    }));
  }

  return { submitted: createdSubmissionIds.length, skipped };
};

const getSubmissionResumeUrl = async (submissionId: number, orgId: number) => {
  const result = await submissionRepository
    .createQueryBuilder("sub")
    .leftJoin("sub.resume", "r", "r.org_id = sub.org_id")
    .where("sub.id = :submissionId", { submissionId })
    .andWhere("sub.org_id = :orgId", { orgId })
    .andWhere("sub.deleted_at IS NULL")
    .select(["r.file_path AS file_path", "r.file_name AS file_name"])
    .getRawOne();

  if (!result || !result.file_path) {
    return null;
  }

  const file_url = await getFileUrl(result.file_path);
  return { file_url, file_name: result.file_name };
};

const CSV_BATCH_SIZE = 100;

const CSV_COLUMNS = [
  { header: "Submission ID", key: "unique_submission_id" },
  { header: "Candidate Name", key: "full_name" },
  { header: "Email", key: "email" },
  { header: "Phone", key: "phone" },
  { header: "Designation", key: "designation" },
  { header: "Experience (Years)", key: "experience_years" },
  { header: "Expected CTC", key: "expected_ctc" },
  { header: "Notice Period", key: "notice_period" },
  { header: "Gender", key: "gender" },
  { header: "Age", key: "age" },
  { header: "Skills", key: "skills" },
  { header: "Industry", key: "industry_name" },
  { header: "City", key: "city" },
  { header: "State", key: "state" },
  { header: "Country", key: "country" },
  { header: "Recruiter", key: "recruiter_name" },
  { header: "Source", key: "source_name" },
  { header: "Status", key: "status_name" },
  { header: "LinkedIn", key: "linkedin_url" },
  { header: "Created At", key: "created_at" },
] as const;

const escapeCsvField = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatPhone = (phone: string | null): string => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 11) {
    return `+${digits.slice(0, 1)} ${digits.slice(1, 6)} ${digits.slice(6)}`;
  }
  return phone;
};

const formatCsvDate = (dateString: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

type OmitSearchAfterLimit = Omit<GetSubmissionsListOptions, "search_after" | "limit">;

const getSubmissionsCsvFromES = async (orgId: number, options: OmitSearchAfterLimit): Promise<string> => {
  const headerRow = CSV_COLUMNS.map((c) => c.header).join(",");
  const rows: string[] = [headerRow];

  let hasMore = true;
  let searchAfter: (string | number)[] | undefined;

  while (hasMore) {
    const filterOptions: SubmissionFilterOptions = {
      org_id: orgId,
      job_id: options.jobId,
      search_after: searchAfter,
      limit: CSV_BATCH_SIZE,
      search: options.search,
      status_id: options.statusId,
      gender: options.gender,
      industry_id: options.industryId,
      source_id: options.sourceId,
      skill_ids: options.skillIds,
      experience_years_min: options.minExperience,
      experience_years_max: options.maxExperience,
      expected_ctc_min: options.minExpectedCtc,
      expected_ctc_max: options.maxExpectedCtc,
      city: options.city,
      state: options.state,
      country: options.country,
      recruiter_user_id: options.recruiterId,
      created_by_id: options.createdById,
      unique_submission_id: options.uniqueSubmissionId,
    };

    const result = await searchSubmissions(filterOptions);
    const esResult = result as { data: SubmissionDocument[]; total: number; hasMore: boolean; last_sort: (string | number)[] | null };

    for (const doc of esResult.data) {
      const record: Record<string, unknown> = {
        unique_submission_id: doc.unique_submission_id,
        full_name: doc.full_name,
        email: doc.email,
        phone: formatPhone(doc.phone),
        designation: doc.designation,
        experience_years: doc.experience_years,
        expected_ctc: doc.expected_ctc,
        notice_period: doc.notice_period,
        gender: doc.gender,
        age: calculateAge(doc.date_of_birth),
        skills: doc.skill_names?.join("; "),
        industry_name: doc.industry_name,
        city: doc.city,
        state: doc.state,
        country: doc.country,
        recruiter_name: doc.recruiter_name,
        source_name: doc.source_name,
        status_name: doc.status_name,
        linkedin_url: doc.linkedin_url,
        created_at: formatCsvDate(doc.created_at),
      };

      const row = CSV_COLUMNS.map((col) => escapeCsvField(record[col.key])).join(",");
      rows.push(row);
    }

    hasMore = esResult.hasMore;
    searchAfter = esResult.last_sort ?? undefined;
  }

  return rows.join("\n");
};

interface BulkSubmitAllFilters {
  search?: string;
  gender?: string;
  industry_id?: number;
  skill_ids?: number[];
  city?: string;
  state?: string;
  country?: string;
  status?: string;
  experience_years_min?: number;
  experience_years_max?: number;
  notice_period_min?: number;
  notice_period_max?: number;
  unique_id?: string;
  created_by_id?: number;
  updated_by_id?: number;
  last_activity_min?: string;
}

const CANDIDATE_BATCH_SIZE = 500;

const bulkSubmitAllCandidates = async (
  orgId: number,
  jobId: string,
  createdBy: number,
  filters?: BulkSubmitAllFilters
) => {
  // Fetch all matching candidate IDs from ES in batches
  const allUserIds: number[] = [];
  let hasMore = true;
  let searchAfter: (string | number)[] | undefined;

  while (hasMore) {
    const filterOptions: CandidateFilterOptions = {
      org_id: orgId,
      idOnly: true,
      search_after: searchAfter,
      limit: CANDIDATE_BATCH_SIZE,
      search: filters?.search,
      gender: filters?.gender,
      industry_id: filters?.industry_id,
      skill_ids: filters?.skill_ids,
      city: filters?.city,
      state: filters?.state,
      country: filters?.country,
      status: filters?.status,
      experience_years_min: filters?.experience_years_min,
      experience_years_max: filters?.experience_years_max,
      notice_period_min: filters?.notice_period_min,
      notice_period_max: filters?.notice_period_max,
      unique_id: filters?.unique_id,
      created_by_id: filters?.created_by_id,
      updated_by_id: filters?.updated_by_id,
      last_activity_min: filters?.last_activity_min,
    };

    const result = await searchCandidates(filterOptions);
    const esResult = result as { ids: string[]; total: number; hasMore: boolean; last_sort: (string | number)[] | null };

    // ES candidate IDs are the document _id which maps to user.id
    const batchIds = esResult.ids.map(Number).filter((n) => !isNaN(n));
    allUserIds.push(...batchIds);

    hasMore = esResult.hasMore;
    searchAfter = esResult.last_sort ?? undefined;
  }

  if (allUserIds.length === 0) {
    return { submitted: 0, skipped: [] };
  }

  // Reuse existing bulk submit logic
  return bulkSubmitCandidates(orgId, jobId, allUserIds, createdBy);
};

const copySubmissionsToJob = async (
  orgId: number,
  submissionIds: number[],
  targetJobId: string,
  userId: number
) => {
  // Fetch source submissions
  const sourceSubmissions = await submissionRepository.find({
    where: { id: In(submissionIds), org_id: orgId, deleted_at: IsNull() },
  });

  if (sourceSubmissions.length === 0) {
    throw new Error("No valid submissions found");
  }

  // Get pipeline (longlist) status for target job
  const pipelineStatus = await getPipelineStatusByJobId(targetJobId, orgId);
  if (!pipelineStatus) {
    throw new Error("Target job configuration error: no pipeline (longlist) status found");
  }

  let submissionCount = await submissionRepository.count({ where: { org_id: orgId } });
  const skippedUserIds: number[] = [];
  const createdSubmissionIds: number[] = [];

  for (const source of sourceSubmissions) {
    if (!source.user_id) continue;

    // Skip if candidate already submitted to target job
    const existing = await getSubmissionByUserAndJob(source.user_id, targetJobId, orgId);
    if (existing) {
      skippedUserIds.push(source.user_id);
      continue;
    }

    submissionCount++;
    const uniqueSubmissionId = `SUB-${source.user_id}-${String(submissionCount).padStart(4, "0")}`;

    const newSubmission = await createSubmission({
      org_id: orgId,
      user_id: source.user_id,
      job_id: targetJobId,
      submission_status_id: pipelineStatus.id,
      recruiter_user_id: userId,
      source_id: source.source_id,
      unique_submission_id: uniqueSubmissionId,
      questions_answers: null,
      expected_ctc: source.expected_ctc,
      offer_ctc: null,
      notice_period: source.notice_period,
      availability: source.availability,
      resume_id: source.resume_id,
      resume_path: source.resume_path,
      submission_date_at: new Date().toISOString(),
      updated_date: null,
      created_by: userId,
      updated_by: null,
      deleted_by: null,
    });
    createdSubmissionIds.push(newSubmission.id);
  }

  // Adjust status count for the pipeline (longlist) status
  if (createdSubmissionIds.length > 0) {
    await adjustStatusCounts({ [pipelineStatus.id]: createdSubmissionIds.length }, orgId);
    updateJobApplicantCounts(targetJobId, orgId);
  }

  // Bulk index all copied submissions in one ES request
  if (createdSubmissionIds.length > 0) {
    bulkAddSubmissionIndex(createdSubmissionIds, orgId);
  }

  // Get names for skipped users
  let skipped: { user_id: number; name: string }[] = [];
  if (skippedUserIds.length > 0) {
    const skippedUsers = await userRepository.find({
      where: { id: In(skippedUserIds), org_id: orgId },
      select: ["id", "first_name", "last_name"],
    });
    skipped = skippedUsers.map((u) => ({
      user_id: u.id,
      name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
    }));
  }

  return { copied: createdSubmissionIds.length, skipped };
};

const submissionStatusRepository = AppDataSource.getRepository(SubmissionStatus);
const candidateDataRepository = AppDataSource.getRepository(CandidateData);

/**
 * When submissions are moved to a JOINED status, mark those candidates as joined
 * in both PostgreSQL (candidate_data) and Elasticsearch (candidate + submission indexes).
 */
const markCandidatesJoined = async (
  orgId: number,
  submissionIds: number[],
  userId: number
) => {
  // Get distinct user_ids (candidate IDs) from the moved submissions
  const rows = await submissionRepository
    .createQueryBuilder("sub")
    .select("DISTINCT sub.user_id", "user_id")
    .where("sub.id IN (:...ids)", { ids: submissionIds })
    .andWhere("sub.org_id = :orgId", { orgId })
    .andWhere("sub.user_id IS NOT NULL")
    .getRawMany<{ user_id: number }>();

  const candidateUserIds = rows.map((r) => r.user_id);
  if (candidateUserIds.length === 0) return;

  // Bulk update candidate_data.joined = true in PostgreSQL
  await candidateDataRepository.update(
    { user_id: In(candidateUserIds), org_id: orgId },
    { joined: true, updated_by: userId }
  );

  // Update Elasticsearch for each candidate (candidate index + all their submissions)
  for (const candidateUserId of candidateUserIds) {
    esUpdateCandidateJoined(candidateUserId, true);
    esUpdateSubmissionJoinedByCandidate(orgId, candidateUserId, true);
  }
};

const bulkUpdateSubmissionStatusService = async (
  orgId: number,
  submissionIds: number[],
  statusId: number,
  jobId: string,
  userId: number
) => {
  // Validate that the target status belongs to this job + org
  const status = await submissionStatusRepository.findOneBy({
    id: statusId,
    job_id: jobId,
    org_id: orgId,
  });

  if (!status) {
    throw new Error("Invalid status: status does not belong to this job");
  }

  // Look up current user's name for ES sync
  const user = await userRepository.findOneBy({ id: userId, org_id: orgId });
  const recruiterName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : "";

  // Query current status distribution for count adjustment
  const currentSubmissions = await submissionRepository
    .createQueryBuilder("sub")
    .select("sub.submission_status_id", "status_id")
    .addSelect("COUNT(*)", "cnt")
    .where("sub.id IN (:...ids)", { ids: submissionIds })
    .andWhere("sub.org_id = :orgId", { orgId })
    .andWhere("sub.deleted_at IS NULL")
    .groupBy("sub.submission_status_id")
    .getRawMany<{ status_id: number; cnt: string }>();

  const countMap: Record<number, number> = {};
  let totalMoved = 0;
  for (const row of currentSubmissions) {
    if (row.status_id === statusId) continue;
    const count = parseInt(row.cnt, 10);
    countMap[row.status_id] = (countMap[row.status_id] ?? 0) - count;
    totalMoved += count;
  }
  if (totalMoved > 0) {
    countMap[statusId] = (countMap[statusId] ?? 0) + totalMoved;
  }

  // Bulk update in PostgreSQL
  const result = await submissionRepository.update(
    { id: In(submissionIds), org_id: orgId, deleted_at: IsNull() },
    { submission_status_id: statusId, recruiter_user_id: userId, updated_by: userId }
  );

  // Adjust status counts
  await adjustStatusCounts(countMap, orgId);
  updateJobApplicantCounts(jobId, orgId);

  // Sync to Elasticsearch
  await esBulkUpdateSubmissionStatus(
    orgId,
    submissionIds,
    statusId,
    status.name,
    userId,
    recruiterName
  );

  // If target status is JOINED, automatically mark candidates as joined
  if (status.status_type === StatusType.JOINED) {
    await markCandidatesJoined(orgId, submissionIds, userId);
  }

  return { updated: result.affected ?? 0 };
};

interface BulkUpdateAllFilters {
  search?: string;
  status_id?: number;
  gender?: string;
  industry_id?: number;
  source_id?: number;
  skill_ids?: number[];
  city?: string;
  state?: string;
  country?: string;
  recruiter_user_id?: number;
  created_by_id?: number;
  unique_submission_id?: string;
  experience_years_min?: number;
  experience_years_max?: number;
  expected_ctc_min?: number;
  expected_ctc_max?: number;
}

const BULK_STATUS_BATCH_SIZE = 500;

const bulkUpdateAllSubmissionStatusService = async (
  orgId: number,
  jobId: string,
  statusId: number,
  userId: number,
  filters?: BulkUpdateAllFilters
) => {
  // Validate that the target status belongs to this job + org
  const status = await submissionStatusRepository.findOneBy({
    id: statusId,
    job_id: jobId,
    org_id: orgId,
  });

  if (!status) {
    throw new Error("Invalid status: status does not belong to this job");
  }

  // Look up current user's name for ES sync
  const user = await userRepository.findOneBy({ id: userId, org_id: orgId });
  const recruiterName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : "";

  // Fetch all matching submission IDs from ES in batches
  const allIds: number[] = [];
  let hasMore = true;
  let searchAfter: (string | number)[] | undefined;

  while (hasMore) {
    const filterOptions: SubmissionFilterOptions = {
      org_id: orgId,
      job_id: jobId,
      idOnly: true,
      search_after: searchAfter,
      limit: BULK_STATUS_BATCH_SIZE,
      search: filters?.search,
      status_id: filters?.status_id,
      gender: filters?.gender,
      industry_id: filters?.industry_id,
      source_id: filters?.source_id,
      skill_ids: filters?.skill_ids,
      city: filters?.city,
      state: filters?.state,
      country: filters?.country,
      recruiter_user_id: filters?.recruiter_user_id,
      created_by_id: filters?.created_by_id,
      unique_submission_id: filters?.unique_submission_id,
      experience_years_min: filters?.experience_years_min,
      experience_years_max: filters?.experience_years_max,
      expected_ctc_min: filters?.expected_ctc_min,
      expected_ctc_max: filters?.expected_ctc_max,
    };

    const result = await searchSubmissions(filterOptions);
    const esResult = result as { ids: string[]; total: number; hasMore: boolean; last_sort: (string | number)[] | null };

    const batchIds = esResult.ids.map(Number).filter((n) => !isNaN(n));
    allIds.push(...batchIds);

    hasMore = esResult.hasMore;
    searchAfter = esResult.last_sort ?? undefined;
  }

  if (allIds.length === 0) {
    return { updated: 0 };
  }

  // Query current status distribution for count adjustment
  const currentSubmissions = await submissionRepository
    .createQueryBuilder("sub")
    .select("sub.submission_status_id", "status_id")
    .addSelect("COUNT(*)", "cnt")
    .where("sub.id IN (:...ids)", { ids: allIds })
    .andWhere("sub.org_id = :orgId", { orgId })
    .andWhere("sub.deleted_at IS NULL")
    .groupBy("sub.submission_status_id")
    .getRawMany<{ status_id: number; cnt: string }>();

  const countMap: Record<number, number> = {};
  let totalMoved = 0;
  for (const row of currentSubmissions) {
    if (row.status_id === statusId) continue;
    const count = parseInt(row.cnt, 10);
    countMap[row.status_id] = (countMap[row.status_id] ?? 0) - count;
    totalMoved += count;
  }
  if (totalMoved > 0) {
    countMap[statusId] = (countMap[statusId] ?? 0) + totalMoved;
  }

  // Bulk update in PostgreSQL
  const pgResult = await submissionRepository.update(
    { id: In(allIds), org_id: orgId, deleted_at: IsNull() },
    { submission_status_id: statusId, recruiter_user_id: userId, updated_by: userId }
  );

  // Adjust status counts
  await adjustStatusCounts(countMap, orgId);
  updateJobApplicantCounts(jobId, orgId);

  // Sync to Elasticsearch
  await esBulkUpdateSubmissionStatus(
    orgId,
    allIds,
    statusId,
    status.name,
    userId,
    recruiterName
  );

  // If target status is JOINED, automatically mark candidates as joined
  if (status.status_type === StatusType.JOINED) {
    await markCandidatesJoined(orgId, allIds, userId);
  }

  return { updated: pgResult.affected ?? 0 };
};

const copyAllSubmissionsToJob = async (
  orgId: number,
  sourceJobId: string,
  targetJobId: string,
  userId: number,
  filters?: BulkUpdateAllFilters
) => {
  // Fetch all matching submission IDs from ES in batches
  const allIds: number[] = [];
  let hasMore = true;
  let searchAfter: (string | number)[] | undefined;

  while (hasMore) {
    const filterOptions: SubmissionFilterOptions = {
      org_id: orgId,
      job_id: sourceJobId,
      idOnly: true,
      search_after: searchAfter,
      limit: BULK_STATUS_BATCH_SIZE,
      search: filters?.search,
      status_id: filters?.status_id,
      gender: filters?.gender,
      industry_id: filters?.industry_id,
      source_id: filters?.source_id,
      skill_ids: filters?.skill_ids,
      city: filters?.city,
      state: filters?.state,
      country: filters?.country,
      recruiter_user_id: filters?.recruiter_user_id,
      created_by_id: filters?.created_by_id,
      unique_submission_id: filters?.unique_submission_id,
      experience_years_min: filters?.experience_years_min,
      experience_years_max: filters?.experience_years_max,
      expected_ctc_min: filters?.expected_ctc_min,
      expected_ctc_max: filters?.expected_ctc_max,
    };

    const result = await searchSubmissions(filterOptions);
    const esResult = result as { ids: string[]; total: number; hasMore: boolean; last_sort: (string | number)[] | null };

    const batchIds = esResult.ids.map(Number).filter((n) => !isNaN(n));
    allIds.push(...batchIds);

    hasMore = esResult.hasMore;
    searchAfter = esResult.last_sort ?? undefined;
  }

  if (allIds.length === 0) {
    return { copied: 0, skipped: [] as { user_id: number; name: string }[] };
  }

  return copySubmissionsToJob(orgId, allIds, targetJobId, userId);
};

const markSubmissionRead = async (submissionId: number, orgId: number) => {
  const submission = await submissionRepository.findOneBy({
    id: submissionId,
    org_id: orgId,
    deleted_at: IsNull(),
  });

  if (!submission) return null;

  await submissionRepository.update(
    { id: submissionId, org_id: orgId },
    { unread: false }
  );

  await esUpdateSubmissionUnread(orgId, submissionId, false);

  return { id: submissionId, unread: false };
};

const markSubmissionUnread = async (submissionId: number, orgId: number) => {
  const submission = await submissionRepository.findOneBy({
    id: submissionId,
    org_id: orgId,
    deleted_at: IsNull(),
  });

  if (!submission) return null;

  await submissionRepository.update(
    { id: submissionId, org_id: orgId },
    { unread: true }
  );

  await esUpdateSubmissionUnread(orgId, submissionId, true);

  return { id: submissionId, unread: true };
};

export {
  submissionRepository,
  createSubmission,
  getSubmissionByUserAndJob,
  getSubmission,
  getSubmissions,
  getSubmissionsListFromES,
  getSubmissionsCsvFromES,
  getSubmissionById,
  getSubmissionQnA,
  updateSubmission,
  bulkSubmitCandidates,
  bulkSubmitAllCandidates,
  getSubmissionResumeUrl,
  bulkUpdateSubmissionStatusService,
  bulkUpdateAllSubmissionStatusService,
  copySubmissionsToJob,
  copyAllSubmissionsToJob,
  markSubmissionRead,
  markSubmissionUnread,
};
