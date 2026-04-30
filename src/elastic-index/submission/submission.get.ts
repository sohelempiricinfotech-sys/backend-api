import { esClient } from "../../utility/elasticsearch";
import { INDEX_NAME, SubmissionDocument } from "./submission.mapping";

export interface SubmissionFilterOptions {
  org_id: number;
  job_id: string; // required — submissions always scoped to a job
  search?: string; // multi_match on full_name, email, phone, designation
  // Term filters
  unique_submission_id?: string;
  status_id?: number;
  user_id?: number;
  gender?: string;
  industry_id?: number;
  source_id?: number;
  status?: string;
  city?: string;
  state?: string;
  country?: string;
  recruiter_user_id?: number;
  created_by_id?: number;
  updated_by_id?: number;
  // Range filters
  expected_ctc_min?: number;
  expected_ctc_max?: number;
  experience_years_min?: number;
  experience_years_max?: number;
  notice_period_min?: number;
  notice_period_max?: number;
  // Date range filters
  created_at_min?: string;
  created_at_max?: string;
  updated_at_min?: string;
  updated_at_max?: string;
  // Array match all
  skill_ids?: number[];
  // Pagination (cursor-based)
  search_after?: (string | number)[];
  limit?: number;
  // Sort
  sort_by?: string;
  sort_order?: "asc" | "desc";
  // Id-only mode
  idOnly?: boolean;
}

interface PaginatedSubmissionResult {
  data: SubmissionDocument[];
  total: number;
  hasMore: boolean;
  last_sort: (string | number)[] | null;
}

interface UnpaginatedSubmissionResult {
  data: SubmissionDocument[];
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

type SearchSubmissionsResult =
  | PaginatedSubmissionResult
  | UnpaginatedSubmissionResult
  | PaginatedIdResult
  | UnpaginatedIdResult;

const TERM_FIELDS = [
  "unique_submission_id",
  "status_id",
  "user_id",
  "gender",
  "industry_id",
  "source_id",
  "status",
  "city",
  "state",
  "country",
  "recruiter_user_id",
  "created_by_id",
  "updated_by_id",
] as const;

const RANGE_PAIRS: { field: string; minKey: string; maxKey: string }[] = [
  { field: "expected_ctc", minKey: "expected_ctc_min", maxKey: "expected_ctc_max" },
  { field: "experience_years", minKey: "experience_years_min", maxKey: "experience_years_max" },
  { field: "notice_period", minKey: "notice_period_min", maxKey: "notice_period_max" },
  // Date ranges
  { field: "created_at", minKey: "created_at_min", maxKey: "created_at_max" },
  { field: "updated_at", minKey: "updated_at_min", maxKey: "updated_at_max" },
];

function buildSubmissionFilter(options: SubmissionFilterOptions): Record<string, unknown> {
  const must: Record<string, unknown>[] = [
    { term: { org_id: options.org_id } },
    { term: { job_id: options.job_id } },
  ];

  // Text search
  if (options.search) {
    must.push({
      multi_match: {
        query: options.search,
        fields: ["full_name", "email", "phone", "designation"],
        type: "phrase_prefix",
      },
    });
  }

  // Term filters
  for (const field of TERM_FIELDS) {
    const value = options[field];
    if (value !== undefined && value !== null) {
      must.push({ term: { [field]: value } });
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

  return { bool: { must } };
}

// Text fields (analyzed) cannot be sorted directly — use their `.keyword` sub-field.
const TEXT_FIELDS_NEEDING_KEYWORD = new Set(["full_name", "designation", "job_title"]);
const resolveSortField = (field: string): string =>
  TEXT_FIELDS_NEEDING_KEYWORD.has(field) ? `${field}.keyword` : field;

// "age" isn't stored in ES — sort by date_of_birth with the opposite order
// (older DoB = older person). asc age = desc DoB, desc age = asc DoB.
function resolveAgeSort(field: string, order: "asc" | "desc"): { field: string; order: "asc" | "desc" } {
  if (field === "age") {
    return { field: "date_of_birth", order: order === "asc" ? "desc" : "asc" };
  }
  return { field, order };
}

export async function searchSubmissions(options: SubmissionFilterOptions): Promise<SearchSubmissionsResult> {
  const query = buildSubmissionFilter(options);
  const requestedSortBy = options.sort_by || "created_at";
  const requestedSortOrder = options.sort_order || "desc";
  const hasPagination = options.limit !== undefined;
  const { field: sortBy, order: sortOrder } = resolveAgeSort(requestedSortBy, requestedSortOrder);
  const resolvedSortBy = resolveSortField(sortBy);

  // Build sort: user-requested field + tiebreakers (created_at, id) for deterministic cursor
  const sort: Record<string, unknown>[] = [{ [resolvedSortBy]: { order: sortOrder } }];
  if (sortBy !== "created_at") {
    sort.push({ created_at: { order: sortOrder } });
  }
  sort.push({ id: { order: sortOrder } });

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

  console.log("[ES] searchSubmissions query:", JSON.stringify(body, null, 2));

  const result = await esClient.search<SubmissionDocument>({
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
  const data = hits.map((hit) => hit._source as SubmissionDocument);

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
