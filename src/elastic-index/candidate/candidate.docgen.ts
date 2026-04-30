import { AppDataSource } from "../../data-source";
import { User } from "../../module/users/user.model";
import { CandidateSkill } from "../../module/candidate-skills/candidate-skill.model";
import { CandidateDocument } from "./candidate.mapping";

export async function generateCandidateDoc(candidateId: number, org_id: number): Promise<CandidateDocument | null> {
  const userRepo = AppDataSource.getRepository(User);

  const row = await userRepo
    .createQueryBuilder("user")
    .leftJoin("candidate_data", "cd", "cd.user_id = user.id AND cd.org_id = user.org_id")
    .leftJoin("user_metadata", "um", "um.user_id = user.id AND um.org_id = user.org_id AND um.deleted_at IS NULL")
    .leftJoin("industries", "industry", "industry.id = cd.industry_id AND industry.org_id = user.org_id AND industry.deleted_at IS NULL")
    .leftJoin("users", "creator", "creator.id = user.created_by AND creator.org_id = user.org_id")
    .leftJoin("users", "updater", "updater.id = user.updated_by AND updater.org_id = user.org_id")
    .select([
      "user.id AS id",
      "user.org_id AS org_id",
      "user.unique_id AS unique_id",
      "TRIM(CONCAT(COALESCE(user.first_name, ''), ' ', COALESCE(user.last_name, ''))) AS full_name",
      "user.email AS email",
      "user.phone AS phone",
      "cd.designation AS designation",
      "cd.experience_years AS experience_years",
      "cd.notice_period AS notice_period",
      "um.gender AS gender",
      "cd.short_summary AS short_summary",
      "cd.resume_content AS resume_content",
      "cd.linkedin_url AS linkedin_url",
      "cd.industry_id AS industry_id",
      "industry.industry AS industry_name",
      "um.date_of_birth AS date_of_birth",
      "um.city AS city",
      "um.state AS state",
      "um.country AS country",
      "user.status AS status",
      "cd.email_send_count AS email_send_count",
      "cd.joined AS joined",
      "user.created_by AS created_by_id",
      "TRIM(CONCAT(COALESCE(creator.first_name, ''), ' ', COALESCE(creator.last_name, ''))) AS created_by_name",
      "user.updated_by AS updated_by_id",
      "TRIM(CONCAT(COALESCE(updater.first_name, ''), ' ', COALESCE(updater.last_name, ''))) AS updated_by_name",
      "user.created_at AS created_at",
      "user.updated_at AS updated_at",
      "user.last_activity AS last_activity",
    ])
    .where("user.id = :candidateId", { candidateId })
    .andWhere("user.org_id = :org_id", { org_id })
    .andWhere("user.system_role = :role", { role: "candidate" })
    .andWhere("user.deleted_at IS NULL")
    .getRawOne();

  if (!row) return null;

  // Fetch skills separately
  const skills = await AppDataSource.getRepository(CandidateSkill)
    .createQueryBuilder("cs")
    .innerJoin("skills", "skill", "skill.id = cs.skill_id AND skill.org_id = cs.org_id")
    .select(["cs.skill_id AS skill_id", "skill.name AS skill_name"])
    .where("cs.user_id = :candidateId", { candidateId })
    .andWhere("cs.org_id = :org_id", { org_id })
    .getRawMany();

  const skillIds = skills.map((s) => s.skill_id);
  const skillNames = skills.map((s) => s.skill_name);

  return {
    id: row.id ?? null,
    org_id: row.org_id ?? null,
    unique_id: row.unique_id ?? null,
    full_name: row.full_name?.trim() || null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    designation: row.designation ?? null,
    experience_years: row.experience_years != null ? parseFloat(row.experience_years) : null,
    notice_period: row.notice_period != null ? parseInt(row.notice_period, 10) : null,
    gender: row.gender ?? null,
    short_summary: row.short_summary ?? null,
    resume_content: row.resume_content ?? null,
    linkedin_url: row.linkedin_url ?? null,
    industry_id: row.industry_id != null ? parseInt(row.industry_id, 10) : null,
    industry_name: row.industry_name ?? null,
    skill_ids: skillIds,
    skill_names: skillNames,
    date_of_birth: row.date_of_birth ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    country: row.country ?? null,
    status: row.status ?? null,
    email_send_count: row.email_send_count != null ? parseInt(row.email_send_count, 10) : null,
    joined: row.joined === true,
    created_by_id: row.created_by_id != null ? parseInt(row.created_by_id, 10) : null,
    created_by_name: row.created_by_name?.trim() || null,
    updated_by_id: row.updated_by_id != null ? parseInt(row.updated_by_id, 10) : null,
    updated_by_name: row.updated_by_name?.trim() || null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    last_activity: row.last_activity ? new Date(row.last_activity).toISOString() : null,
  };
}
