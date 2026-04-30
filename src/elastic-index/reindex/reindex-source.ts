import { AppDataSource } from "../../data-source";
import { Submission } from "../../module/submissions/submission.model";
import { addSubmissionIndex } from "../submission/submission.operation";

/**
 * Re-index all ES documents that reference the given source.
 * Call this after a source is updated (e.g. renamed) so that
 * denormalized source data in ES stays in sync.
 *
 * Never throws — logs errors so callers are not blocked.
 */
export async function reindexBySource(sourceId: number, org_id: number): Promise<void> {
  try {
    const submissions = await AppDataSource.getRepository(Submission)
      .createQueryBuilder("sub")
      .select("sub.id", "id")
      .where("sub.source_id = :sourceId", { sourceId })
      .andWhere("sub.org_id = :org_id", { org_id })
      .andWhere("sub.deleted_at IS NULL")
      .getRawMany<{ id: number }>();

    console.log(`[ES] Reindex source ${sourceId}: ${submissions.length} submission(s)`);
    for (const s of submissions) {
      await addSubmissionIndex(s.id, org_id);
    }
  } catch (err) {
    console.error(`[ES] reindexBySource failed (sourceId=${sourceId}, org_id=${org_id}):`, err);
  }
}
