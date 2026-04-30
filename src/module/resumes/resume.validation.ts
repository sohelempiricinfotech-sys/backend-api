import { z } from "zod";

export const createResumeSchema = z.object({
  org_id: z.number().optional(),
  user_id: z.number().positive("User ID must be a positive number"),
  file_name: z.string().optional(),
  file_path: z.string().optional(),
  all_resumes: z.object({}).passthrough().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateResumeSchema = z.object({
  org_id: z.number().optional(),
  user_id: z.number().optional(),
  file_name: z.string().optional(),
  file_path: z.string().optional(),
  all_resumes: z.object({}).passthrough().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
