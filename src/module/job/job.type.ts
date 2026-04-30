import { QuestionType } from "../questions/question.model";

export enum JobStatus {
  ACTIVE = "Active",
  CLOSED = "Closed",
  DRAFT = "Draft",
}

// Question input type for job create/update requests
export interface QuestionInput {
  id?: number;
  question_text: string;
  description?: string;
  question_type: QuestionType;
  options?: string[];
  is_required?: boolean;
  order?: number;
  isDeleted?: boolean;
}

export type JobPostType = {
  id: string;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  project_id: number | null;
  team_leader_id: number | null;
  owner_user_id: number | null;
  industry_id: number | null;
  branch_id: number | null;
  contact_person_id: number | null;
  assignee_ids: number[] | null;
  interviewer_id: number | null;

  // ---------- JOB DETAILS ----------
  job_title: string | null;
  job_description: string | null;
  unique_job_id: string | null;
  experience: string | null;
  question: string | null;
  number_of_positions: string | null;
  customer: string | null;
  target_date: Date | null;
  description: string | null;

  // ---------- LOCATION DETAILS ----------
  job_address: string | null;
  pincode: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  remote_status: string | null;

  // ---------- JOB TYPE & PLACEMENT DETAILS ----------
  job_type: string | null;
  placement_type: string | null;
  min_ctc: number | null;
  max_ctc: number | null;
  onetime_placement_bill_type: string | null;
  onetime_placement_bill_value: string | null;

  // ---------- STATUS & VERIFICATION ----------
  is_verified: boolean | null;
  status: JobStatus | null;
  published: boolean;

  // ---------- CONTACT DETAILS ----------
  owner_phone: string | null;
  country_code: string | null;
  state_code: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateJobPostInput = Omit<
  JobPostType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateJobPostInput = Partial<JobPostType>;
