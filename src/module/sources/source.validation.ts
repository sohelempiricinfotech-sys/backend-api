import { z } from "zod";

export const createSourceSchema = z.object({
  org_id: z.number().positive("Organization ID must be a positive number").optional(),
  source: z.string().min(1, "Source name is required"),
});

export const updateSourceSchema = z.object({
  org_id: z.number().optional(),
  source: z.string().optional(),
  order: z.number().optional(),
});

