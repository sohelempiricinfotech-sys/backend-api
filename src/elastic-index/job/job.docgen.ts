import { AppDataSource } from "../../data-source";
import { JobPost } from "../../module/job/job.model";
import { JobPostSkill } from "../../module/job-skills/job-skill.model";
import { StatusType } from "../../module/submission-statuses/submission-status.model";
import { getSubmissionStatusesByJobId } from "../../module/submission-statuses/submission-status.services";
import { JobDocument } from "./job.mapping";

export async function generateJobDoc(jobId: string, org_id: number): Promise<JobDocument | null> {
  const jobRepo = AppDataSource.getRepository(JobPost);

  const row = await jobRepo
    .createQueryBuilder("job")
    .leftJoin("projects", "project", "project.id = job.project_id AND project.org_id = job.org_id")
    .leftJoin("industries", "industry", "industry.id = job.industry_id AND industry.org_id = job.org_id AND industry.deleted_at IS NULL")
    .leftJoin("users", "owner", "owner.id = job.owner_user_id AND owner.org_id = job.org_id")
    .leftJoin("users", "creator", "creator.id = job.created_by AND creator.org_id = job.org_id")
    .leftJoin("users", "updater", "updater.id = job.updated_by AND updater.org_id = job.org_id")
    .select([
      "job.id AS id",
      "job.org_id AS org_id",
      "job.unique_job_id AS unique_job_id",
      "job.job_title AS job_title",
      "job.job_description AS job_description",
      "job.experience AS experience",
      "job.number_of_positions AS positions",
      "job.city AS city",
      "job.state AS state",
      "job.country AS country",
      "job.remote_status AS remote_status",
      "job.job_type AS job_type",
      "job.placement_type AS placement_type",
      "job.min_ctc AS min_ctc",
      "job.max_ctc AS max_ctc",
      "job.status AS status",
      "job.published AS published",
      "job.is_verified AS is_verified",
      "job.project_id AS project_id",
      "project.name AS project_name",
      "job.industry_id AS industry_id",
      "industry.industry AS industry_name",
      "job.owner_user_id AS owner_user_id",
      "TRIM(CONCAT(COALESCE(owner.first_name, ''), ' ', COALESCE(owner.last_name, ''))) AS owner_name",
      "job.created_by AS created_by_id",
      "TRIM(CONCAT(COALESCE(creator.first_name, ''), ' ', COALESCE(creator.last_name, ''))) AS created_by_name",
      "job.updated_by AS updated_by_id",
      "TRIM(CONCAT(COALESCE(updater.first_name, ''), ' ', COALESCE(updater.last_name, ''))) AS updated_by_name",
      "job.created_at AS created_at",
      "job.updated_at AS updated_at",
    ])
    .where("job.id = :jobId", { jobId })
    .andWhere("job.org_id = :org_id", { org_id })
    .andWhere("job.deleted_at IS NULL")
    .getRawOne();

  if (!row) return null;

  // Fetch skills separately
  const skills = await AppDataSource.getRepository(JobPostSkill)
    .createQueryBuilder("js")
    .innerJoin("skills", "skill", "skill.id = js.skill_id AND skill.org_id = js.org_id")
    .select(["js.skill_id AS skill_id", "skill.name AS skill_name"])
    .where("js.job_post_id = :jobId", { jobId })
    .andWhere("js.org_id = :org_id", { org_id })
    .getRawMany();

  const skillIds = skills.map((s) => s.skill_id);
  const skillNames = skills.map((s) => s.skill_name);

  // Fetch total_applicant and total_joined from submission_statuses
  const statuses = await getSubmissionStatusesByJobId(jobId, org_id);
  let totalApplicant = 0;
  let totalJoined = 0;
  for (const s of statuses) {
    if (s.status_type === StatusType.JOINED) {
      totalJoined += s.count;
    }
    if (s.status_type === StatusType.APPLICATION) {
      totalApplicant += s.count;
    }
  }


  return {
    id: row.id ?? null,
    org_id: row.org_id ?? null,
    unique_job_id: row.unique_job_id ?? null,
    job_title: row.job_title ?? null,
    job_description: row.job_description ?? null,
    experience: row.experience != null ? parseInt(row.experience, 10) || null : null,
    positions: row.positions != null ? parseInt(row.positions, 10) || null : null,
    city: row.city ?? null,
    state: row.state ?? null,
    country: row.country ?? null,
    remote_status: row.remote_status ?? null,
    job_type: row.job_type ?? null,
    placement_type: row.placement_type ?? null,
    min_ctc: row.min_ctc != null ? parseFloat(row.min_ctc) || null : null,
    max_ctc: row.max_ctc != null ? parseFloat(row.max_ctc) || null : null,
    status: row.status ?? null,
    published: row.published ?? true,
    is_verified: row.is_verified ?? null,
    project_id: row.project_id != null ? parseInt(row.project_id, 10) : null,
    project_name: row.project_name ?? null,
    industry_id: row.industry_id != null ? parseInt(row.industry_id, 10) : null,
    industry_name: row.industry_name ?? null,
    skill_ids: skillIds,
    skill_names: skillNames,
    total_applicant: totalApplicant,
    total_joined: totalJoined,
    owner_user_id: row.owner_user_id != null ? parseInt(row.owner_user_id, 10) : null,
    owner_name: row.owner_name?.trim() || null,
    created_by_id: row.created_by_id != null ? parseInt(row.created_by_id, 10) : null,
    created_by_name: row.created_by_name?.trim() || null,
    updated_by_id: row.updated_by_id != null ? parseInt(row.updated_by_id, 10) : null,
    updated_by_name: row.updated_by_name?.trim() || null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}
