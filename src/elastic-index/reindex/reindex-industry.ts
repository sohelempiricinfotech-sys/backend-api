import { AppDataSource } from "../../data-source";
import { CandidateData } from "../../module/candidate-data/candidate-data.model";
import { JobPost } from "../../module/job/job.model";
import { Submission } from "../../module/submissions/submission.model";
import { addCandidateIndex } from "../candidate/candidate.operation";
import { addJobIndex } from "../job/job.operation";
import { addSubmissionIndex } from "../submission/submission.operation";

/**
 * Re-index all ES documents that reference the given industry.
 * Call this after an industry is updated (e.g. renamed) so that
 * denormalized industry data in ES stays in sync.
 *
 * Never throws — logs errors so callers are not blocked.
 */
export async function reindexByIndustry(industryId: number, org_id: number): Promise<void> {
  try {
    // ---- Candidates ----
    const candidates = await AppDataSource.getRepository(CandidateData)
      .createQueryBuilder("cd")
      .select("cd.user_id", "user_id")
      .where("cd.industry_id = :industryId", { industryId })
      .andWhere("cd.org_id = :org_id", { org_id })
      .andWhere("cd.deleted_at IS NULL")
      .getRawMany<{ user_id: number }>();

    console.log(`[ES] Reindex industry ${industryId}: ${candidates.length} candidate(s)`);
    for (const c of candidates) {
      await addCandidateIndex(c.user_id, org_id);
    }

    // ---- Jobs ----
    const jobs = await AppDataSource.getRepository(JobPost)
      .createQueryBuilder("jp")
      .select("jp.id", "id")
      .where("jp.industry_id = :industryId", { industryId })
      .andWhere("jp.org_id = :org_id", { org_id })
      .andWhere("jp.deleted_at IS NULL")
      .getRawMany<{ id: string }>();

    console.log(`[ES] Reindex industry ${industryId}: ${jobs.length} job(s)`);
    for (const j of jobs) {
      await addJobIndex(j.id, org_id);
    }

    // ---- Submissions (via candidate_data industry) ----
    const submissions = await AppDataSource.getRepository(Submission)
      .createQueryBuilder("sub")
      .innerJoin(
        CandidateData,
        "cd",
        "cd.user_id = sub.user_id AND cd.org_id = sub.org_id"
      )
      .select("sub.id", "id")
      .where("cd.industry_id = :industryId", { industryId })
      .andWhere("sub.org_id = :org_id", { org_id })
      .andWhere("sub.deleted_at IS NULL")
      .andWhere("cd.deleted_at IS NULL")
      .getRawMany<{ id: number }>();

    console.log(`[ES] Reindex industry ${industryId}: ${submissions.length} submission(s)`);
    for (const s of submissions) {
      await addSubmissionIndex(s.id, org_id);
    }
  } catch (err) {
    console.error(`[ES] reindexByIndustry failed (industryId=${industryId}, org_id=${org_id}):`, err);
  }
}
