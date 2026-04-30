export type UserNotificationType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number;

  // ---------- NOTIFICATION DETAILS ----------
  type: string;
  message: string;
  link: string | null;
  status: string;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateUserNotificationInput = Omit<
  UserNotificationType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateUserNotificationInput = Partial<UserNotificationType>;
