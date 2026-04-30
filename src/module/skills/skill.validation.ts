import { z } from "zod";

export const createSkillSchema = z.object({
  org_id: z.number().positive("Organization ID must be a positive number").optional(),
  name: z.string().min(1, "Skill name is required"),
});

export const updateSkillSchema = z.object({
  org_id: z.number().optional(),
  name: z.string().optional(),
});
