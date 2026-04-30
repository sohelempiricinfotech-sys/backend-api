import { z } from "zod";
import { SystemRole } from "./user.model";

export const createUserSchema = z.object({
  org_id: z.number().optional(),
  role_id: z.number().optional(),
  unique_id: z.string().optional(),

  // ---------- BASIC USER INFO ----------
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email format").transform(val => val.toLowerCase()),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),

  // ---------- SECURITY / AUTH ----------
  oneTimeVerificationCode: z.string().optional(),
  is_password: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  status: z.string().default("Active").optional(),
  system_role: z.nativeEnum(SystemRole).default(SystemRole.CANDIDATE).optional(),

  user_detail: z.record(z.any()).optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  two_factor_otp: z.number().optional(),
  otp_expires_at: z.coerce.date().optional(),

  // ---------- LOGIN & ACTIVITY ----------
  login_attempts: z.number().optional(),
  login_attempts_at: z.coerce.date().optional(),
  resume_views_by_user: z.number().optional(),
  resume_view_reset_time: z.coerce.date().optional(),
  file_download_count: z.number().optional(),
  file_download_reset_time: z.coerce.date().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

// Team management schemas (simplified for admin use)
export const createTeamUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email format").transform(val => val.toLowerCase()),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  system_role: z.enum([SystemRole.ORG_ADMIN, SystemRole.EMPLOYEE]).default(SystemRole.EMPLOYEE),
});

export const updateTeamUserSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email format").transform(val => val.toLowerCase()).optional(),
  phone: z.string().optional(),
  system_role: z.enum([SystemRole.ORG_ADMIN, SystemRole.EMPLOYEE]).optional(),
});

export const updateUserSchema = z.object({
  org_id: z.number().optional(),
  role_id: z.number().optional(),
  unique_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email format").transform(val => val.toLowerCase()).optional(),
  phone: z.string().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  oneTimeVerificationCode: z.string().optional(),
  is_password: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  status: z.string().optional(),
  system_role: z.nativeEnum(SystemRole).optional(),
  user_detail: z.record(z.any()).optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  two_factor_otp: z.number().optional(),
  otp_expires_at: z.coerce.date().optional(),

  login_attempts: z.number().optional(),
  login_attempts_at: z.coerce.date().optional(),
  resume_views_by_user: z.number().optional(),
  resume_view_reset_time: z.coerce.date().optional(),
  file_download_count: z.number().optional(),
  file_download_reset_time: z.coerce.date().optional(),

  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
