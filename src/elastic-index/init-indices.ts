import { pingElasticsearch, esClient } from "../utility/elasticsearch";

import { INDEX_NAME as CANDIDATES_INDEX, mapping as candidatesMapping } from "./candidate/candidate.mapping";
import { INDEX_NAME as JOBS_INDEX, mapping as jobsMapping } from "./job/job.mapping";
import { INDEX_NAME as SUBMISSIONS_INDEX, mapping as submissionsMapping } from "./submission/submission.mapping";

const indices = [
  { name: CANDIDATES_INDEX, mapping: candidatesMapping },
  { name: JOBS_INDEX, mapping: jobsMapping },
  { name: SUBMISSIONS_INDEX, mapping: submissionsMapping },
];

export async function initIndices(): Promise<void> {
  const alive = await pingElasticsearch();
  if (!alive) {
    console.warn("[ES] Elasticsearch is unreachable — skipping index initialization");
    return;
  }

  for (const { name, mapping } of indices) {
    try {
      const exists = await esClient.indices.exists({ index: name });
      if (exists) {
        // Sync any new mapping fields into the existing index
        await esClient.indices.putMapping({ index: name, ...mapping });
        console.log(`[ES] Index "${name}": already exists — mapping updated`);
        continue;
      }

      await esClient.indices.create({ index: name, mappings: mapping });
      console.log(`[ES] Index "${name}": created`);
    } catch (err) {
      console.error(`[ES] Failed to create index "${name}":`, err);
    }
  }
}
