import { z } from "zod";

export const createUserActivitySchema = z.object({
  org_id: z.number().positive("Organization ID must be a positive number"),
  user_id: z.number().optional(),
  component: z.string().optional(),
  activity: z.string().optional(),
  user_role: z.string().optional(),
  activity_on: z.string().optional(),
  re_data: z.object({}).passthrough().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateUserActivitySchema = z.object({
  org_id: z.number().optional(),
  user_id: z.number().optional(),
  component: z.string().optional(),
  activity: z.string().optional(),
  user_role: z.string().optional(),
  activity_on: z.string().optional(),
  re_data: z.object({}).passthrough().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
