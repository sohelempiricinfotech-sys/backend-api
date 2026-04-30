export type SubmissionType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number | null;
  job_id: string | null;
  submission_status_id: number | null;
  recruiter_user_id: number | null;
  source_id: number | null;

  // ---------- SUBMISSION INFO ----------
  unique_submission_id: string | null;
  questions_answers: Record<string, any> | null;

  // ---------- COMPENSATION & AVAILABILITY ----------
  expected_ctc: string | null;
  offer_ctc: string | null;
  notice_period: number | null;
  availability: string | null;

  // ---------- RESUME ----------
  resume_id: number | null;
  resume_path: string | null;

  // ---------- READ STATUS ----------
  unread: boolean;

  // ---------- DATES ----------
  submission_date_at: string | null;
  updated_date: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateSubmissionInput = Omit<
  SubmissionType,
  "id" | "created_at" | "updated_at" | "deleted_at" | "unread"
>;

export type UpdateSubmissionInput = Partial<SubmissionType>;
