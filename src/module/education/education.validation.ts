import { z } from "zod";

export const createEducationSchema = z.object({
  org_id: z.number().optional(),
  user_id: z.number().positive("User ID must be a positive number"),
  degree: z.string().optional(),
  institution: z.string().optional(),
  field_of_study: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  gpa: z.number().min(0).max(4).optional(),
  transcript_file: z.string().optional(),
  certificate_file: z.string().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateEducationSchema = z.object({
  org_id: z.number().optional(),
  user_id: z.number().optional(),
  degree: z.string().optional(),
  institution: z.string().optional(),
  field_of_study: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  gpa: z.number().optional(),
  transcript_file: z.string().optional(),
  certificate_file: z.string().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
