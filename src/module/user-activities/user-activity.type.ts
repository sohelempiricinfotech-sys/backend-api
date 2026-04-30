export type UserActivityType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number | null;

  // ---------- ACTIVITY DETAILS ----------
  component: string | null;
  activity: string | null;
  user_role: string | null;
  activity_on: string | null;
  re_data: Record<string, any> | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateUserActivityInput = Omit<
  UserActivityType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateUserActivityInput = Partial<UserActivityType>;
