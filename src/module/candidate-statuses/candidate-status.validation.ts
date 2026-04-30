import { z } from "zod";

export const createCandidateStatusSchema = z.object({
  org_id: z.number().positive("Organization ID must be a positive number"),
  name: z.string().min(1, "Status name is required"),
  order: z.number().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateCandidateStatusSchema = z.object({
  org_id: z.number().optional(),
  name: z.string().optional(),
  order: z.number().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
