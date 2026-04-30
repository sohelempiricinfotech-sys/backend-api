import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  features: z.object({}).passthrough().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updatePlanSchema = z.object({
  name: z.string().optional(),
  features: z.object({}).passthrough().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
