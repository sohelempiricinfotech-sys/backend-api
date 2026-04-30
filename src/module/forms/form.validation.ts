import { z } from "zod";

export const createFormSchema = z.object({
  org_id: z.number().positive("Organization ID must be a positive number"),
  owner_name_id: z.number().optional(),
  fields: z.object({}).passthrough().optional(),
  type: z.string().min(1, "Form type is required"),
  description: z.string().optional(),
  title: z.string().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateFormSchema = z.object({
  org_id: z.number().optional(),
  owner_name_id: z.number().optional(),
  fields: z.object({}).passthrough().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  title: z.string().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
