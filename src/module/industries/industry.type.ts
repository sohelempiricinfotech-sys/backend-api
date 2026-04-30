export type IndustryType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;

  // ---------- INDUSTRY DETAILS ----------
  industry: string;
  order: number | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateIndustryInput = Omit<
  IndustryType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateIndustryInput = Partial<IndustryType>;
