export type EducationType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number;

  // ---------- EDUCATION DETAILS ----------
  degree: string | null;
  institution: string | null;
  field_of_study: string | null;
  start_date: Date | null;
  end_date: Date | null;
  gpa: number | null;

  // ---------- FILE DETAILS ----------
  transcript_file: string | null;
  certificate_file: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateEducationInput = Omit<
  EducationType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateEducationInput = Partial<EducationType>;
