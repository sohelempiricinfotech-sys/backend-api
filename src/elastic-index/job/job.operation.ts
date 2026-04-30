import { esClient } from "../../utility/elasticsearch";
import { StatusType } from "../../module/submission-statuses/submission-status.model";
import { getSubmissionStatusesByJobId } from "../../module/submission-statuses/submission-status.services";
import { INDEX_NAME } from "./job.mapping";
import { generateJobDoc } from "./job.docgen";

/**
 * Generate job document from DB and upsert into ES.
 * If job not found / deleted → removes from ES (ignores 404).
 * Never throws — logs errors so callers are not blocked.
 */
export async function addJobIndex(jobId: string, org_id: number): Promise<void> {
  try {
    const doc = await generateJobDoc(jobId, org_id);

    if (doc === null) {
      await removeJobIndex(jobId);
      return;
    }

    await esClient.index({
      index: INDEX_NAME,
      id: String(jobId),
      document: doc,
      refresh: "wait_for",
    });
  } catch (err) {
    console.error(`[ES] Failed to index job ${jobId}:`, err);
  }
}

/**
 * Partial update of the `published` field in ES.
 * Never throws — logs errors so callers are not blocked.
 */
export async function toggleJobPublished(jobId: string, orgId: number, published: boolean): Promise<void> {
  try {
    await esClient.update({
      index: INDEX_NAME,
      id: String(jobId),
      doc: { published },
      refresh: "wait_for",
    });
  } catch (err) {
    console.error(`[ES] Failed to toggle published for job ${jobId}:`, err);
  }
}

/**
 * Fetch total_applicant & total_joined from submission_statuses
 * and partially update the job ES document.
 * Never throws — logs errors so callers are not blocked.
 */
export async function updateJobApplicantCounts(jobId: string, orgId: number): Promise<void> {
  try {
    // Fetch total_applicant and total_joined from submission_statuses
    const statuses = await getSubmissionStatusesByJobId(jobId, orgId);
    let total_applicant = 0;
    let total_joined = 0;
    for (const s of statuses) {
      if (s.status_type === StatusType.JOINED) {
        total_joined += s.count;
      }
      if (s.status_type === StatusType.APPLICATION) {
        total_applicant += s.count;
      }
    }

    await esClient.update({
      index: INDEX_NAME,
      id: String(jobId),
      doc: { total_applicant, total_joined },
      refresh: "wait_for",
    });
  } catch (err) {
    console.error(`[ES] Failed to update applicant counts for job ${jobId}:`, err);
  }
}

/**
 * Remove a job document from ES. Ignores 404.
 */
export async function removeJobIndex(jobId: string): Promise<void> {
  try {
    await esClient.delete({
      index: INDEX_NAME,
      id: String(jobId),
      refresh: "wait_for",
    });
  } catch (err: unknown) {
    const is404 = err instanceof Error && "statusCode" in err && (err as Record<string, unknown>).statusCode === 404;
    if (!is404) {
      console.error(`[ES] Failed to remove job ${jobId}:`, err);
    }
  }
}
