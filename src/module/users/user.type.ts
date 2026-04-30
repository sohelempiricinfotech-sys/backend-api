import { SystemRole } from "./user.model";

export type UserType = {
  id: number;
  uuid_id: string | null;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  role_id: number | null;

  // ---------- BASIC USER INFO ----------
  unique_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  password: string;

  profile_photo: string | null;

  // ---------- SECURITY / AUTH ----------
  oneTimeVerificationCode: string | null;
  is_password: boolean | null;
  is_verified: boolean | null;
  status: string | null;
  system_role: SystemRole;
  user_detail: Record<string, any> | null;
  access_token: string | null;
  refresh_token: string | null;
  two_factor_otp: number | null;
  otp_expires_at: Date | null;

  // ---------- LOGIN & ACTIVITY TRACKING ----------
  login_attempts: number | null;
  login_attempts_at: Date | null;
  resume_views_by_user: number | null;
  resume_view_reset_time: Date | null;
  file_download_count: number | null;
  file_download_reset_time: Date | null;

  // ---------- ONBOARDING ----------
  onboard: boolean | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};
export type CreateUserInput = Omit<
  UserType,
  "id" | "uuid_id" | "created_at" | "updated_at" | "deleted_at"
>;
export type UpdateUserInput = Partial<UserType>;
