import { z } from "zod";

export const createUserNotificationSchema = z.object({
  org_id: z.number().positive("Organization ID must be a positive number"),
  user_id: z.number().positive("User ID must be a positive number"),
  type: z.enum(["new_submission", "interview_update", "status_change", "new_message"]),
  message: z.string().min(1, "Message is required"),
  link: z.string().url("Invalid URL").optional(),
  status: z.enum(["sent", "delivered", "read"]).default("sent").optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateUserNotificationSchema = z.object({
  org_id: z.number().optional(),
  user_id: z.number().optional(),
  type: z.enum(["new_submission", "interview_update", "status_change", "new_message"]).optional(),
  message: z.string().optional(),
  link: z.string().optional(),
  status: z.enum(["sent", "delivered", "read"]).optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
