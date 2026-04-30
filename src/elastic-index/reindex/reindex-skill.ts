import { AppDataSource } from "../../data-source";
import { CandidateSkill } from "../../module/candidate-skills/candidate-skill.model";
import { JobPostSkill } from "../../module/job-skills/job-skill.model";
import { Submission } from "../../module/submissions/submission.model";
import { addCandidateIndex } from "../candidate/candidate.operation";
import { addJobIndex } from "../job/job.operation";
import { addSubmissionIndex } from "../submission/submission.operation";

/**
 * Re-index all ES documents that reference the given skill.
 * Call this after a skill is updated (e.g. renamed) so that
 * denormalized skill data in ES stays in sync.
 *
 * Never throws — logs errors so callers are not blocked.
 */
export async function reindexBySkill(skillId: number, org_id: number): Promise<void> {
  try {
    // ---- Candidates ----
    const candidates = await AppDataSource.getRepository(CandidateSkill)
      .createQueryBuilder("cs")
      .select("cs.user_id", "user_id")
      .where("cs.skill_id = :skillId", { skillId })
      .andWhere("cs.org_id = :org_id", { org_id })
      .getRawMany<{ user_id: number }>();

    console.log(`[ES] Reindex skill ${skillId}: ${candidates.length} candidate(s)`);
    for (const c of candidates) {
      await addCandidateIndex(c.user_id, org_id);
    }

    // ---- Jobs ----
    const jobs = await AppDataSource.getRepository(JobPostSkill)
      .createQueryBuilder("js")
      .select("js.job_post_id", "job_post_id")
      .where("js.skill_id = :skillId", { skillId })
      .andWhere("js.org_id = :org_id", { org_id })
      .getRawMany<{ job_post_id: string }>();

    console.log(`[ES] Reindex skill ${skillId}: ${jobs.length} job(s)`);
    for (const j of jobs) {
      await addJobIndex(j.job_post_id, org_id);
    }

    // ---- Submissions (via candidate_skills) ----
    const submissions = await AppDataSource.getRepository(Submission)
      .createQueryBuilder("sub")
      .innerJoin(
        CandidateSkill,
        "cs",
        "cs.user_id = sub.user_id AND cs.org_id = sub.org_id"
      )
      .select("sub.id", "id")
      .where("cs.skill_id = :skillId", { skillId })
      .andWhere("sub.org_id = :org_id", { org_id })
      .andWhere("sub.deleted_at IS NULL")
      .getRawMany<{ id: number }>();

    console.log(`[ES] Reindex skill ${skillId}: ${submissions.length} submission(s)`);
    for (const s of submissions) {
      await addSubmissionIndex(s.id, org_id);
    }
  } catch (err) {
    console.error(`[ES] reindexBySkill failed (skillId=${skillId}, org_id=${org_id}):`, err);
  }
}
