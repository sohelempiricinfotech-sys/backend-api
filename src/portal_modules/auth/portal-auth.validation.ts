import { z } from "zod";

export const portalLoginSchema = z.object({
  email: z.string().email("Invalid email address.").transform(val => val.toLowerCase()),
  password: z.string().min(1, "Password is required."),
});

export const portalRegisterSchema = z.object({
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address.").transform(val => val.toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters."),
  phone: z.string().optional(),
});

export const portalRefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required."),
});

export const portalForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address.").transform(val => val.toLowerCase()),
});

export const portalResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
