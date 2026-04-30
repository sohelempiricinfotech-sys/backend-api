import { esClient } from "../../utility/elasticsearch";
import { INDEX_NAME } from "./submission.mapping";
import { generateSubmissionDoc, generateSubmissionDocs } from "./submission.docgen";

/**
 * Generate submission document from DB and upsert into ES.
 * If submission not found / deleted → removes from ES (ignores 404).
 * Never throws — logs errors so callers are not blocked.
 */
export async function addSubmissionIndex(submissionId: number, org_id: number): Promise<void> {
  try {
    const doc = await generateSubmissionDoc(submissionId, org_id);

    if (doc === null) {
      await removeSubmissionIndex(submissionId);
      return;
    }

    await esClient.index({
      index: INDEX_NAME,
      id: String(submissionId),
      document: doc,
      refresh: "wait_for",
    });
  } catch (err) {
    console.error(`[ES] Failed to index submission ${submissionId}:`, err);
  }
}

/**
 * Bulk-index multiple submissions into ES using the bulk API.
 * Generates all documents in 2 DB queries, then sends a single bulk request.
 * Never throws — logs errors so callers are not blocked.
 */
export async function bulkAddSubmissionIndex(
  submissionIds: number[],
  org_id: number
): Promise<void> {
  if (submissionIds.length === 0) return;

  try {
    const docsMap = await generateSubmissionDocs(submissionIds, org_id);

    if (docsMap.size === 0) return;

    const operations: object[] = [];
    for (const [id, doc] of docsMap) {
      operations.push({ index: { _index: INDEX_NAME, _id: String(id) } });
      operations.push(doc);
    }

    const response = await esClient.bulk({ operations, refresh: "wait_for" });

    if (response.errors) {
      const failed = response.items.filter((item) => item.index?.error);
      console.error(
        `[ES] Bulk index: ${failed.length}/${docsMap.size} submissions failed:`,
        failed.map((item) => ({
          id: item.index?._id,
          error: item.index?.error?.reason,
        }))
      );
    }
  } catch (err) {
    console.error(`[ES] Failed to bulk index ${submissionIds.length} submissions:`, err);
  }
}

/**
 * Bulk-update status_id and status_name for multiple submissions in ES.
 * Only updates documents that match the given org_id and submission IDs.
 * Never throws — logs errors so callers are not blocked.
 */
export async function bulkUpdateSubmissionStatus(
  orgId: number,
  submissionIds: number[],
  statusId: number,
  statusName: string,
  recruiterId: number,
  recruiterName: string
): Promise<void> {
  if (submissionIds.length === 0) return;

  try {
    await esClient.updateByQuery({
      index: INDEX_NAME,
      refresh: true,
      query: {
        bool: {
          must: [
            { term: { org_id: orgId } },
            { terms: { id: submissionIds } },
          ],
        },
      },
      script: {
        source:
          "ctx._source.status_id = params.status_id; ctx._source.status_name = params.status_name; ctx._source.recruiter_user_id = params.recruiter_user_id; ctx._source.recruiter_name = params.recruiter_name;",
        lang: "painless",
        params: {
          status_id: statusId,
          status_name: statusName,
          recruiter_user_id: recruiterId,
          recruiter_name: recruiterName,
        },
      },
    });
  } catch (err) {
    console.error(`[ES] Failed to bulk update submission status for org ${orgId}:`, err);
  }
}

/**
 * Increment email_send_count by 1 for multiple submissions in ES.
 * Never throws — logs errors so callers are not blocked.
 */
export async function incrementSubmissionEmailCount(
  orgId: number,
  submissionIds: number[]
): Promise<void> {
  if (submissionIds.length === 0) return;

  try {
    await esClient.updateByQuery({
      index: INDEX_NAME,
      refresh: true,
      query: {
        bool: {
          must: [
            { term: { org_id: orgId } },
            { terms: { id: submissionIds } },
          ],
        },
      },
      script: {
        source: "ctx._source.email_send_count += 1",
        lang: "painless",
      },
    });
  } catch (err) {
    console.error(`[ES] Failed to increment email_send_count for submissions in org ${orgId}:`, err);
  }
}

/**
 * Update joined status for all submissions belonging to a candidate in ES.
 * Uses updateByQuery to update all submissions matching the candidate's user_id and org_id.
 * Never throws — logs errors so callers are not blocked.
 */
export async function updateSubmissionJoinedByCandidate(
  orgId: number,
  candidateUserId: number,
  joined: boolean
): Promise<void> {
  try {
    await esClient.updateByQuery({
      index: INDEX_NAME,
      refresh: true,
      query: {
        bool: {
          must: [
            { term: { org_id: orgId } },
            { term: { user_id: candidateUserId } },
          ],
        },
      },
      script: {
        source: "ctx._source.joined = params.joined",
        lang: "painless",
        params: { joined },
      },
    });
  } catch (err) {
    console.error(`[ES] Failed to update joined for submissions of candidate ${candidateUserId} in org ${orgId}:`, err);
  }
}

/**
 * Update unread status for a single submission in ES.
 * Never throws — logs errors so callers are not blocked.
 */
export async function updateSubmissionUnread(
  orgId: number,
  submissionId: number,
  unread: boolean
): Promise<void> {
  try {
    await esClient.update({
      index: INDEX_NAME,
      id: String(submissionId),
      doc: { unread },
      refresh: "wait_for",
    });
  } catch (err) {
    console.error(`[ES] Failed to update unread for submission ${submissionId}:`, err);
  }
}

/**
 * Remove a submission document from ES. Ignores 404.
 */
export async function removeSubmissionIndex(submissionId: number): Promise<void> {
  try {
    await esClient.delete({
      index: INDEX_NAME,
      id: String(submissionId),
      refresh: "wait_for",
    });
  } catch (err: unknown) {
    const is404 = err instanceof Error && "statusCode" in err && (err as Record<string, unknown>).statusCode === 404;
    if (!is404) {
      console.error(`[ES] Failed to remove submission ${submissionId}:`, err);
    }
  }
}
