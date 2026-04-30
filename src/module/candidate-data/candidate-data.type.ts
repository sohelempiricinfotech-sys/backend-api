export type CandidateDataType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number;
  status: number | null;
  owner_user_id: number | null;
  industry_id: number | null;

  // ---------- EXPERIENCE & DESIGNATION ----------
  experience_years: number | null;
  designation: string | null;
  reference: Record<string, any> | null;

  // ---------- COMMUNICATION & DETAILS ----------
  send_mail: boolean | null;
  short_summary: string | null;
  notice_period: number | null;
  resume_content: string | null;
  objectives: string[] | null;

  // ---------- OTHER DETAILS ----------
  linkedin_url: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateCandidateDataInput = Omit<
  CandidateDataType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateCandidateDataInput = Partial<CandidateDataType>;
