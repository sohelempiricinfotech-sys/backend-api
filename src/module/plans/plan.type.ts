export type PlanType = {
  id: number;

  org_id: number;

  // ---------- PLAN DETAILS ----------
  name: string;
  features: Record<string, any> | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreatePlanInput = Omit<
  PlanType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdatePlanInput = Partial<PlanType>;
