import { StatusType } from "./submission-status.model";

export type SubmissionStatusType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  job_id: string;

  // ---------- STATUS DETAILS ----------
  name: string;
  order: number | null;
  is_default?: boolean;
  status_type: StatusType;
  count: number;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateSubmissionStatusInput = Omit<
  SubmissionStatusType,
  "id" | "created_at" | "updated_at" | "deleted_at" | "count"
>;

export type UpdateSubmissionStatusInput = Partial<SubmissionStatusType>;
