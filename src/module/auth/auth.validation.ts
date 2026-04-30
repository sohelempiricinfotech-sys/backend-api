import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").transform(val => val.toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email format").transform(val => val.toLowerCase()),
  otp: z.string().min(6, "OTP must be at least 6 digits"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email format").transform(val => val.toLowerCase()),
});

export const passwordResetSchema = z.object({
  email: z.string().email("Invalid email format").transform(val => val.toLowerCase()),
  otp: z.string().min(6, "OTP must be at least 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});

export const verifyTokenSchema = z.object({
  access_token: z.string().min(1, "Access token is required"),
});

export const resendOtpSchema = z.object({
  email: z.string().email("Invalid email format").transform(val => val.toLowerCase()),
});
