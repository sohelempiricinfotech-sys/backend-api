export const INDEX_NAME = "jobs";

export const mapping = {
  dynamic: "strict",
  properties: {
    id: { type: "keyword" },
    org_id: { type: "integer" },
    unique_job_id: { type: "keyword" },
    job_title: { type: "text" },
    job_description: { type: "text" },
    experience: { type: "integer" },
    positions: { type: "integer" },
    city: { type: "keyword" },
    state: { type: "keyword" },
    country: { type: "keyword" },
    remote_status: { type: "keyword" },
    job_type: { type: "keyword" },
    placement_type: { type: "keyword" },
    min_ctc: { type: "float" },
    max_ctc: { type: "float" },
    status: { type: "keyword" },
    published: { type: "boolean" },
    is_verified: { type: "boolean" },
    project_id: { type: "integer" },
    project_name: { type: "keyword" },
    industry_id: { type: "integer" },
    industry_name: { type: "keyword" },
    skill_ids: { type: "keyword" },
    skill_names: { type: "text" },
    owner_user_id: { type: "integer" },
    owner_name: { type: "keyword" },
    created_by_id: { type: "integer" },
    created_by_name: { type: "keyword" },
    updated_by_id: { type: "integer" },
    updated_by_name: { type: "keyword" },
    total_applicant: { type: "integer" },
    total_joined: { type: "integer" },
    created_at: { type: "date" },
    updated_at: { type: "date" },
  },
} as const;

export type JobDocument = {
  id: string | null;
  org_id: number | null;
  unique_job_id: string | null;
  job_title: string | null;
  job_description: string | null;
  experience: number | null;
  positions: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  remote_status: string | null;
  job_type: string | null;
  placement_type: string | null;
  min_ctc: number | null;
  max_ctc: number | null;
  status: string | null;
  published: boolean;
  is_verified: boolean | null;
  project_id: number | null;
  project_name: string | null;
  industry_id: number | null;
  industry_name: string | null;
  skill_ids: number[];
  skill_names: string[];
  owner_user_id: number | null;
  owner_name: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  updated_by_id: number | null;
  updated_by_name: string | null;
  total_applicant: number;
  total_joined: number;
  created_at: string | null;
  updated_at: string | null;
};
