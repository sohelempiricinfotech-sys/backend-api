export const INDEX_NAME = "candidates";

export const mapping = {
  dynamic: "strict",
  properties: {
    id: { type: "integer" },
    org_id: { type: "integer" },
    unique_id: { type: "keyword" },
    full_name: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
    email: { type: "text" },
    phone: { type: "text" },
    designation: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
    experience_years: { type: "float" },
    notice_period: { type: "integer" },
    gender: { type: "keyword" },
    short_summary: { type: "text" },
    resume_content: { type: "text" },
    linkedin_url: { type: "keyword" },
    industry_id: { type: "integer" },
    industry_name: { type: "keyword" },
    skill_ids: { type: "keyword" },
    skill_names: { type: "text" },
    date_of_birth: { type: "keyword" },
    city: { type: "keyword" },
    state: { type: "keyword" },
    country: { type: "keyword" },
    status: { type: "keyword" },
    created_by_id: { type: "integer" },
    created_by_name: { type: "keyword" },
    updated_by_id: { type: "integer" },
    updated_by_name: { type: "keyword" },
    created_at: { type: "date" },
    email_send_count: { type: "integer" },
    joined: { type: "boolean" },
    updated_at: { type: "date" },
    last_activity: { type: "date" },
  },
} as const;

export type CandidateDocument = {
  id: number | null;
  org_id: number | null;
  unique_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  experience_years: number | null;
  notice_period: number | null;
  gender: string | null;
  short_summary: string | null;
  resume_content: string | null;
  linkedin_url: string | null;
  industry_id: number | null;
  industry_name: string | null;
  skill_ids: number[];
  skill_names: string[];
  date_of_birth: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  updated_by_id: number | null;
  updated_by_name: string | null;
  created_at: string | null;
  email_send_count: number | null;
  joined: boolean | null;
  updated_at: string | null;
  last_activity: string | null;
};
