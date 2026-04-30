export type SkillType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;

  // ---------- SKILL DETAILS ----------
  name: string;
  lower_name: string;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateSkillInput = Omit<
  SkillType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateSkillInput = Partial<SkillType>;
