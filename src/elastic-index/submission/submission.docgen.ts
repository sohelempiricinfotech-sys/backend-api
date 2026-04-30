import { AppDataSource } from "../../data-source";
import { Submission } from "../../module/submissions/submission.model";
import { CandidateSkill } from "../../module/candidate-skills/candidate-skill.model";
import { SubmissionDocument } from "./submission.mapping";

/**
 * Build a SubmissionDocument from a raw DB row + skills array.
 */
function buildDoc(
  row: Record<string, any>,
  skills: { skill_id: number; skill_name: string }[]
): SubmissionDocument {
  return {
    id: row.id ?? null,
    org_id: row.org_id ?? null,
    unique_submission_id: row.unique_submission_id ?? null,
    job_id: row.job_id ?? null,
    job_title: row.job_title ?? null,
    status_id: row.status_id != null ? parseInt(row.status_id, 10) : null,
    status_name: row.status_name ?? null,
    user_id: row.user_id != null ? parseInt(row.user_id, 10) : null,
    unique_id: row.unique_id ?? null,
    full_name: row.full_name?.trim() || null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    designation: row.designation ?? null,
    experience_years: row.experience_years != null ? parseFloat(row.experience_years) : null,
    notice_period: row.notice_period != null ? parseInt(row.notice_period, 10) : null,
    gender: row.gender ?? null,
    linkedin_url: row.linkedin_url ?? null,
    source_id: row.source_id != null ? parseInt(row.source_id, 10) : null,
    source_name: row.source_name ?? null,
    industry_id: row.industry_id != null ? parseInt(row.industry_id, 10) : null,
    industry_name: row.industry_name ?? null,
    skill_ids: skills.map((s) => s.skill_id),
    skill_names: skills.map((s) => s.skill_name),
    date_of_birth: row.date_of_birth ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    country: row.country ?? null,
    status: row.status ?? null,
    expected_ctc: row.expected_ctc != null ? parseInt(row.expected_ctc, 10) || null : null,
    availability: row.availability ?? null,
    recruiter_user_id: row.recruiter_user_id != null ? parseInt(row.recruiter_user_id, 10) : null,
    recruiter_name: row.recruiter_name?.trim() || null,
    submission_date_at: row.submission_date_at ?? null,
    created_by_id: row.created_by_id != null ? parseInt(row.created_by_id, 10) : null,
    created_by_name: row.created_by_name?.trim() || null,
    updated_by_id: row.updated_by_id != null ? parseInt(row.updated_by_id, 10) : null,
    updated_by_name: row.updated_by_name?.trim() || null,
    email_send_count: row.email_send_count != null ? parseInt(row.email_send_count, 10) : null,
    joined: row.joined === true,
    unread: row.unread === true || row.unread === "true" || row.unread === 1,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

/**
 * Shared query builder for submission + joined data.
 * Returns a base QueryBuilder with all joins and selects; caller adds the WHERE clause.
 */
function baseSubmissionQuery() {
  const subRepo = AppDataSource.getRepository(Submission);

  return subRepo
    .createQueryBuilder("sub")
    .leftJoin("job_posts", "job", "job.id = sub.job_id AND job.org_id = sub.org_id")
    .leftJoin("submission_statuses", "ss", "ss.id = sub.submission_status_id AND ss.org_id = sub.org_id")
    .leftJoin("users", "u", "u.id = sub.user_id AND u.org_id = sub.org_id")
    .leftJoin("candidate_data", "cd", "cd.user_id = sub.user_id AND cd.org_id = sub.org_id")
    .leftJoin("user_metadata", "um", "um.user_id = sub.user_id AND um.org_id = sub.org_id AND um.deleted_at IS NULL")
    .leftJoin("sources", "source", "source.id = sub.source_id AND source.org_id = sub.org_id AND source.deleted_at IS NULL")
    .leftJoin("industries", "industry", "industry.id = cd.industry_id AND industry.org_id = sub.org_id AND industry.deleted_at IS NULL")
    .leftJoin("users", "recruiter", "recruiter.id = sub.recruiter_user_id AND recruiter.org_id = sub.org_id")
    .leftJoin("users", "creator", "creator.id = sub.created_by AND creator.org_id = sub.org_id")
    .leftJoin("users", "updater", "updater.id = sub.updated_by AND updater.org_id = sub.org_id")
    .select([
      "sub.id AS id",
      "sub.org_id AS org_id",
      "sub.unique_submission_id AS unique_submission_id",
      "sub.job_id AS job_id",
      "job.job_title AS job_title",
      "sub.submission_status_id AS status_id",
      "ss.name AS status_name",
      "sub.user_id AS user_id",
      "u.unique_id AS unique_id",
      "TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS full_name",
      "u.email AS email",
      "u.phone AS phone",
      "cd.designation AS designation",
      "cd.experience_years AS experience_years",
      "cd.notice_period AS notice_period",
      "um.gender AS gender",
      "cd.linkedin_url AS linkedin_url",
      "sub.source_id AS source_id",
      "source.source AS source_name",
      "cd.industry_id AS industry_id",
      "industry.industry AS industry_name",
      "um.date_of_birth AS date_of_birth",
      "um.city AS city",
      "um.state AS state",
      "um.country AS country",
      "u.status AS status",
      "sub.expected_ctc AS expected_ctc",
      "sub.availability AS availability",
      "sub.recruiter_user_id AS recruiter_user_id",
      "TRIM(CONCAT(COALESCE(recruiter.first_name, ''), ' ', COALESCE(recruiter.last_name, ''))) AS recruiter_name",
      "sub.submission_date_at AS submission_date_at",
      "sub.created_by AS created_by_id",
      "TRIM(CONCAT(COALESCE(creator.first_name, ''), ' ', COALESCE(creator.last_name, ''))) AS created_by_name",
      "sub.updated_by AS updated_by_id",
      "TRIM(CONCAT(COALESCE(updater.first_name, ''), ' ', COALESCE(updater.last_name, ''))) AS updated_by_name",
      "sub.email_send_count AS email_send_count",
      "cd.joined AS joined",
      "sub.unread AS unread",
      "sub.created_at AS created_at",
      "sub.updated_at AS updated_at",
    ]);
}

export async function generateSubmissionDoc(submissionId: number, org_id: number): Promise<SubmissionDocument | null> {
  const row = await baseSubmissionQuery()
    .where("sub.id = :submissionId", { submissionId })
    .andWhere("sub.org_id = :org_id", { org_id })
    .andWhere("sub.deleted_at IS NULL")
    .getRawOne();

  if (!row) return null;

  const skills = await AppDataSource.getRepository(CandidateSkill)
    .createQueryBuilder("cs")
    .innerJoin("skills", "skill", "skill.id = cs.skill_id AND skill.org_id = cs.org_id")
    .select(["cs.skill_id AS skill_id", "skill.name AS skill_name"])
    .where("cs.user_id = :userId", { userId: row.user_id })
    .andWhere("cs.org_id = :org_id", { org_id })
    .getRawMany();

  return buildDoc(row, skills);
}

/**
 * Bulk-generate submission documents for multiple IDs in just 2 DB queries.
 * Returns a Map<submissionId, SubmissionDocument>. Missing/deleted IDs are omitted.
 */
export async function generateSubmissionDocs(
  submissionIds: number[],
  org_id: number
): Promise<Map<number, SubmissionDocument>> {
  const result = new Map<number, SubmissionDocument>();
  if (submissionIds.length === 0) return result;

  // 1) Fetch all submission rows in one query
  const rows = await baseSubmissionQuery()
    .where("sub.id IN (:...submissionIds)", { submissionIds })
    .andWhere("sub.org_id = :org_id", { org_id })
    .andWhere("sub.deleted_at IS NULL")
    .getRawMany();

  if (rows.length === 0) return result;

  // 2) Collect unique user_ids to fetch all skills in one query
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

  const allSkills: { user_id: number; skill_id: number; skill_name: string }[] =
    userIds.length > 0
      ? await AppDataSource.getRepository(CandidateSkill)
          .createQueryBuilder("cs")
          .innerJoin("skills", "skill", "skill.id = cs.skill_id AND skill.org_id = cs.org_id")
          .select([
            "cs.user_id AS user_id",
            "cs.skill_id AS skill_id",
            "skill.name AS skill_name",
          ])
          .where("cs.user_id IN (:...userIds)", { userIds })
          .andWhere("cs.org_id = :org_id", { org_id })
          .getRawMany()
      : [];

  // 3) Group skills by user_id
  const skillsByUser = new Map<number, { skill_id: number; skill_name: string }[]>();
  for (const s of allSkills) {
    const uid = Number(s.user_id);
    if (!skillsByUser.has(uid)) skillsByUser.set(uid, []);
    skillsByUser.get(uid)!.push({ skill_id: s.skill_id, skill_name: s.skill_name });
  }

  // 4) Build documents
  for (const row of rows) {
    const userId = row.user_id != null ? Number(row.user_id) : null;
    const skills = userId != null ? skillsByUser.get(userId) ?? [] : [];
    result.set(row.id, buildDoc(row, skills));
  }

  return result;
}
