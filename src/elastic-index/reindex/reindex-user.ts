import { AppDataSource } from "../../data-source";
import { User } from "../../module/users/user.model";
import { JobPost } from "../../module/job/job.model";
import { Submission } from "../../module/submissions/submission.model";
import { addCandidateIndex } from "../candidate/candidate.operation";
import { addJobIndex } from "../job/job.operation";
import { addSubmissionIndex } from "../submission/submission.operation";

/**
 * Re-index all ES documents that reference the given user.
 * Call this after a user is updated (e.g. name change) so that
 * denormalized user data (created_by_name, updated_by_name,
 * recruiter_name) in ES stays in sync.
 *
 * Never throws — logs errors so callers are not blocked.
 */
export async function reindexByUser(userId: number, org_id: number): Promise<void> {
  try {
    // ---- Candidates ----
    const candidates = await AppDataSource.getRepository(User)
      .createQueryBuilder("u")
      .select("u.id", "id")
      .where(
        "(u.created_by = :userId OR u.updated_by = :userId OR u.deleted_by = :userId)",
        { userId }
      )
      .andWhere("u.org_id = :org_id", { org_id })
      .andWhere("u.deleted_at IS NULL")
      .getRawMany<{ id: number }>();

    console.log(`[ES] Reindex user ${userId}: ${candidates.length} candidate(s)`);
    for (const c of candidates) {
      await addCandidateIndex(c.id, org_id);
    }

    // ---- Jobs ----
    const jobs = await AppDataSource.getRepository(JobPost)
      .createQueryBuilder("jp")
      .select("jp.id", "id")
      .where(
        "(jp.created_by = :userId OR jp.updated_by = :userId OR jp.deleted_by = :userId)",
        { userId }
      )
      .andWhere("jp.org_id = :org_id", { org_id })
      .andWhere("jp.deleted_at IS NULL")
      .getRawMany<{ id: string }>();

    console.log(`[ES] Reindex user ${userId}: ${jobs.length} job(s)`);
    for (const j of jobs) {
      await addJobIndex(j.id, org_id);
    }

    // ---- Submissions ----
    const submissions = await AppDataSource.getRepository(Submission)
      .createQueryBuilder("sub")
      .select("sub.id", "id")
      .where(
        "(sub.created_by = :userId OR sub.updated_by = :userId OR sub.deleted_by = :userId OR sub.recruiter_user_id = :userId)",
        { userId }
      )
      .andWhere("sub.org_id = :org_id", { org_id })
      .andWhere("sub.deleted_at IS NULL")
      .getRawMany<{ id: number }>();

    console.log(`[ES] Reindex user ${userId}: ${submissions.length} submission(s)`);
    for (const s of submissions) {
      await addSubmissionIndex(s.id, org_id);
    }
  } catch (err) {
    console.error(`[ES] reindexByUser failed (userId=${userId}, org_id=${org_id}):`, err);
  }
}
