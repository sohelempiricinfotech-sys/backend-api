import { z } from "zod";

export const upsertSmtpSettingsSchema = z.object({
  host: z.string().min(1, "SMTP host is required").max(255),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean().optional(),
  username: z.string().min(1, "Username is required").max(255),
  password: z.string().min(1, "Password is required").max(500),
  from_email: z.string().email("Invalid email").max(255),
  from_name: z.string().max(255).nullable().optional(),
});
