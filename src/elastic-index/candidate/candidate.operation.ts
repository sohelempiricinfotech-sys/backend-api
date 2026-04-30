import { esClient } from "../../utility/elasticsearch";
import { INDEX_NAME } from "./candidate.mapping";
import { generateCandidateDoc } from "./candidate.docgen";

/**
 * Generate candidate document from DB and upsert into ES.
 * If candidate not found / deleted → removes from ES (ignores 404).
 * Never throws — logs errors so callers are not blocked.
 */
export async function addCandidateIndex(candidateId: number, org_id: number): Promise<void> {
  try {
    const doc = await generateCandidateDoc(candidateId, org_id);

    if (doc === null) {
      await removeCandidateIndex(candidateId);
      return;
    }

    await esClient.index({
      index: INDEX_NAME,
      id: String(candidateId),
      document: doc,
      refresh: "wait_for",
    });
  } catch (err) {
    console.error(`[ES] Failed to index candidate ${candidateId}:`, err);
  }
}

/**
 * Increment email_send_count by 1 for multiple candidates in ES.
 * Accepts candidate user_id values.
 * Never throws — logs errors so callers are not blocked.
 */
export async function incrementCandidateEmailCount(
  orgId: number,
  candidateIds: number[]
): Promise<void> {
  if (candidateIds.length === 0) return;

  try {
    await esClient.updateByQuery({
      index: INDEX_NAME,
      refresh: true,
      query: {
        bool: {
          must: [
            { term: { org_id: orgId } },
            { terms: { id: candidateIds } },
          ],
        },
      },
      script: {
        source: "ctx._source.email_send_count += 1",
        lang: "painless",
      },
    });
  } catch (err) {
    console.error(`[ES] Failed to increment email_send_count for candidates in org ${orgId}:`, err);
  }
}

/**
 * Update last_activity for a candidate in ES via partial doc update.
 * Never throws — logs errors so callers are not blocked.
 */
export async function updateCandidateLastActivity(
  orgId: number,
  candidateId: number,
  lastActivity: string
): Promise<void> {
  try {
    await esClient.update({
      index: INDEX_NAME,
      id: String(candidateId),
      doc: { last_activity: lastActivity },
      refresh: "wait_for",
    });
  } catch (err: unknown) {
    const is404 =
      err instanceof Error &&
      "statusCode" in err &&
      (err as Record<string, unknown>).statusCode === 404;
    if (!is404) {
      console.error(
        `[ES] Failed to update last_activity for candidate ${candidateId} in org ${orgId}:`,
        err
      );
    }
  }
}

/**
 * Update joined status for a candidate in ES via partial doc update.
 * Never throws — logs errors so callers are not blocked.
 */
export async function updateCandidateJoined(
  candidateId: number,
  joined: boolean
): Promise<void> {
  try {
    await esClient.update({
      index: INDEX_NAME,
      id: String(candidateId),
      doc: { joined },
      refresh: "wait_for",
    });
  } catch (err: unknown) {
    const is404 =
      err instanceof Error &&
      "statusCode" in err &&
      (err as Record<string, unknown>).statusCode === 404;
    if (!is404) {
      console.error(
        `[ES] Failed to update joined for candidate ${candidateId}:`,
        err
      );
    }
  }
}

/**
 * Remove a candidate document from ES. Ignores 404.
 */
export async function removeCandidateIndex(candidateId: number): Promise<void> {
  try {
    await esClient.delete({
      index: INDEX_NAME,
      id: String(candidateId),
      refresh: "wait_for",
    });
  } catch (err: unknown) {
    const is404 = err instanceof Error && "statusCode" in err && (err as Record<string, unknown>).statusCode === 404;
    if (!is404) {
      console.error(`[ES] Failed to remove candidate ${candidateId}:`, err);
    }
  }
}
