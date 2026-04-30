export type ExperienceType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number;

  // ---------- EXPERIENCE DETAILS ----------
  job_title: string | null;
  company_name: string | null;
  location: string | null;
  start_date: Date | null;
  end_date: Date | null;
  is_present: boolean;
  description: string | null;

  // ---------- FILE DETAILS ----------
  experience_letter_file: string | null;
  salary_slip_file: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateExperienceInput = Omit<
  ExperienceType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateExperienceInput = Partial<ExperienceType>;
