import { z } from "zod";

export const createIndustrySchema = z.object({
  org_id: z.number().positive("Organization ID must be a positive number").optional(), // org_id is usually taken from token, but if validated in body it should be optional or removed if not in body
  industry: z.string().min(1, "Industry name is required"),
});

export const updateIndustrySchema = z.object({
  org_id: z.number().optional(),
  industry: z.string().optional(),
  order: z.number().optional(),
});
