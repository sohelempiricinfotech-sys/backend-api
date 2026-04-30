export type ResumeType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number;

  // ---------- FILE DETAILS ----------
  file_name: string | null;
  file_path: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateResumeInput = Omit<
  ResumeType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateResumeInput = Partial<ResumeType>;
