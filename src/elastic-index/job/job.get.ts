import { esClient } from "../../utility/elasticsearch";
import { INDEX_NAME, JobDocument } from "./job.mapping";

export interface JobFilterOptions {
  org_id: number;
  search?: string;
  // Term filters
  unique_job_id?: string;
  city?: string;
  state?: string;
  country?: string;
  remote_status?: string;
  job_type?: string;
  placement_type?: string;
  status?: string | string[];
  published?: boolean;
  is_verified?: boolean;
  project_id?: number;
  industry_id?: number;
  owner_user_id?: number;
  created_by_id?: number;
  updated_by_id?: number;
  // Range filters
  experience_min?: number;
  experience_max?: number;
  positions_min?: number;
  positions_max?: number;
  ctc_min?: number;
  ctc_max?: number;
  // Array match all
  skill_ids?: number[];
  // Pagination (cursor-based)
  limit?: number;
  search_after?: (string | number)[];
  // Sort
  sort_by?: string;
  sort_order?: "asc" | "desc";
  // Exclude jobs with project
  no_project?: boolean;
  // Id-only mode
  idOnly?: boolean;
}

interface PaginatedJobResult {
  data: JobDocument[];
  total: number;
  hasMore: boolean;
  last_sort: (string | number)[] | null;
}

interface UnpaginatedJobResult {
  data: JobDocument[];
  total: number;
}

interface PaginatedIdResult {
  ids: string[];
  total: number;
  hasMore: boolean;
  last_sort: (string | number)[] | null;
}

interface UnpaginatedIdResult {
  ids: string[];
}

type SearchJobsResult =
  | PaginatedJobResult
  | UnpaginatedJobResult
  | PaginatedIdResult
  | UnpaginatedIdResult;

const TERM_FIELDS = [
  "unique_job_id",
  "city",
  "state",
  "country",
  "remote_status",
  "job_type",
  "placement_type",
  "status",
  "published",
  "is_verified",
  "project_id",
  "industry_id",
  "owner_user_id",
  "created_by_id",
  "updated_by_id",
] as const;

const RANGE_PAIRS: { field: string; minKey: string; maxKey: string }[] = [
  { field: "experience", minKey: "experience_min", maxKey: "experience_max" },
  { field: "positions", minKey: "positions_min", maxKey: "positions_max" },
];

function buildJobFilter(options: JobFilterOptions): Record<string, unknown> {
  const must: Record<string, unknown>[] = [{ term: { org_id: options.org_id } }];

  // Text search
  if (options.search) {
    must.push({
      multi_match: {
        query: options.search,
        fields: ["job_title", "job_description"],
        type: "phrase_prefix",
      },
    });
  }

  // Term filters
  for (const field of TERM_FIELDS) {
    const value = options[field];
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        must.push({ terms: { [field]: value } });
      } else {
        must.push({ term: { [field]: value } });
      }
    }
  }

  // Range filters
  const opts = options as unknown as Record<string, unknown>;
  for (const { field, minKey, maxKey } of RANGE_PAIRS) {
    const min = opts[minKey];
    const max = opts[maxKey];

    if (min !== undefined || max !== undefined) {
      const range: Record<string, unknown> = {};
      if (min !== undefined) range.gte = min;
      if (max !== undefined) range.lte = max;
      must.push({ range: { [field]: range } });
    }
  }

  // CTC overlap: find jobs whose [min_ctc, max_ctc] overlaps with filter [ctc_min, ctc_max]
  if (options.ctc_min !== undefined) {
    must.push({ range: { max_ctc: { gte: options.ctc_min } } });
  }
  if (options.ctc_max !== undefined) {
    must.push({ range: { min_ctc: { lte: options.ctc_max } } });
  }

  // Skill IDs — match ALL provided skills
  if (options.skill_ids && options.skill_ids.length > 0) {
    must.push({
      terms_set: {
        skill_ids: {
          terms: options.skill_ids,
          minimum_should_match_script: {
            source: "params.num_terms",
          },
        },
      },
    });
  }

  const mustNot: Record<string, unknown>[] = [];

  // Exclude jobs that have a project
  if (options.no_project) {
    mustNot.push({ exists: { field: "project_id" } });
  }

  const boolQuery: Record<string, unknown> = { must };
  if (mustNot.length > 0) {
    boolQuery.must_not = mustNot;
  }

  return { bool: boolQuery };
}

export async function searchJobs(options: JobFilterOptions): Promise<SearchJobsResult> {
  const query = buildJobFilter(options);
  const sortBy = options.sort_by || "created_at";
  const sortOrder = options.sort_order || "desc";
  const hasPagination = options.limit !== undefined;

  // Build sort: user-requested field + tiebreakers (created_at, id) for deterministic cursor
  const sort: Record<string, unknown>[] = [ { [sortBy]: { order: sortOrder } }];
  if (sortBy !== "created_at") {
    sort.push({ created_at: { order: sortOrder } });
  }
  sort.push({ id: { order: sortOrder } })

  const body: Record<string, unknown> = {
    query,
    sort,
    track_total_hits: true,
  };

  if (options.idOnly) {
    body._source = ["id"];
  }

  if (hasPagination) {
    body.size = options.limit;

    if (options.search_after && options.search_after.length > 0) {
      body.search_after = options.search_after;
    }
  }

  console.log("[ES] searchJobs query:", JSON.stringify(body, null, 2));

  const result = await esClient.search<JobDocument>({
    index: INDEX_NAME,
    body,
  });

  const total =
    typeof result.hits.total === "number"
      ? result.hits.total
      : result.hits.total?.value ?? 0;

  const hits = result.hits.hits;
  const lastHit = hits.length > 0 ? hits[hits.length - 1] : null;
  const lastSort = (lastHit?.sort as (string | number)[] | undefined) ?? null;

  // idOnly mode
  if (options.idOnly) {
    const ids = hits.map((hit) => hit._id!);

    if (hasPagination) {
      return {
        ids,
        total,
        hasMore: hits.length === options.limit!,
        last_sort: lastSort,
      };
    }

    return { ids };
  }

  // Full document mode
  const data = hits.map((hit) => hit._source as JobDocument);

  if (hasPagination) {
    return {
      data,
      total,
      hasMore: hits.length === options.limit!,
      last_sort: lastSort,
    };
  }

  return { data, total };
}
