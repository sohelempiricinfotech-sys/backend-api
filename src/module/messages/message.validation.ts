import { z } from "zod";

export const createMessageSchema = z.object({
  org_id: z.number().positive("Organization ID must be a positive number"),
  message: z.string().optional(),
  type: z.string().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateMessageSchema = z.object({
  org_id: z.number().optional(),
  message: z.string().optional(),
  type: z.string().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
