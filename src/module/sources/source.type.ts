export type SourceType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;

  // ---------- SOURCE DETAILS ----------
  source: string;
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

export type CreateSourceInput = Omit<
  SourceType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateSourceInput = Partial<SourceType>;
