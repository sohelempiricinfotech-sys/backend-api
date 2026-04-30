export const INDEX_NAME = "submissions";

export const mapping = {
  dynamic: "strict",
  properties: {
    id: { type: "integer" },
    org_id: { type: "integer" },
    unique_submission_id: { type: "keyword" },
    job_id: { type: "keyword" },
    job_title: { type: "text" },
    status_id: { type: "integer" },
    status_name: { type: "keyword" },
    // ─── Candidate fields (all from candidate mapping) ───
    user_id: { type: "integer" },
    unique_id: { type: "keyword" },
    full_name: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
    email: { type: "text" },
    phone: { type: "text" },
    designation: { type: "text", fields: { keyword: { type: "keyword", ignore_above: 256 } } },
    experience_years: { type: "float" },
    notice_period: { type: "integer" },
    gender: { type: "keyword" },
    linkedin_url: { type: "keyword" },
    source_id: { type: "integer" },
    source_name: { type: "keyword" },
    industry_id: { type: "integer" },
    industry_name: { type: "keyword" },
    skill_ids: { type: "keyword" },
    skill_names: { type: "text" },
    date_of_birth: { type: "keyword" },
    city: { type: "keyword" },
    state: { type: "keyword" },
    country: { type: "keyword" },
    status: { type: "keyword" },
    // ─── Submission-specific fields ───
    expected_ctc: { type: "integer" },
    availability: { type: "keyword" },
    recruiter_user_id: { type: "integer" },
    recruiter_name: { type: "keyword" },
    submission_date_at: { type: "keyword" },
    created_by_id: { type: "integer" },
    created_by_name: { type: "keyword" },
    updated_by_id: { type: "integer" },
    updated_by_name: { type: "keyword" },
    created_at: { type: "date" },
    email_send_count: { type: "integer" },
    joined: { type: "boolean" },
    unread: { type: "boolean" },
    updated_at: { type: "date" },
  },
} as const;

export type SubmissionDocument = {
  id: number | null;
  org_id: number | null;
  unique_submission_id: string | null;
  job_id: string | null;
  job_title: string | null;
  status_id: number | null;
  status_name: string | null;
  user_id: number | null;
  unique_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  experience_years: number | null;
  notice_period: number | null;
  gender: string | null;
  linkedin_url: string | null;
  source_id: number | null;
  source_name: string | null;
  industry_id: number | null;
  industry_name: string | null;
  skill_ids: number[];
  skill_names: string[];
  date_of_birth: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string | null;
  expected_ctc: number | null;
  availability: string | null;
  recruiter_user_id: number | null;
  recruiter_name: string | null;
  submission_date_at: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  updated_by_id: number | null;
  updated_by_name: string | null;
  created_at: string | null;
  email_send_count: number | null;
  joined: boolean | null;
  unread: boolean;
  updated_at: string | null;
};
