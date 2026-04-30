import { z } from "zod";

export const createTeamValidationSchema = z.object({
  org_id: z.string().uuid("Invalid org_id format"),
  team_name: z.string().min(1, "Team name is required").max(255),
  description: z.string().optional(),
  team_head_id: z.string().uuid("Invalid team_head_id format").optional(),
  is_active: z.boolean().default(true),
  created_by: z.string().optional(),
});

export const updateTeamValidationSchema = z.object({
  team_name: z.string().min(1, "Team name is required").max(255).optional(),
  description: z.string().optional(),
  team_head_id: z.string().uuid("Invalid team_head_id format").optional(),
  is_active: z.boolean().optional(),
  updated_by: z.string().optional(),
});

export type CreateTeamValidation = z.infer<
  typeof createTeamValidationSchema
>;
export type UpdateTeamValidation = z.infer<
  typeof updateTeamValidationSchema
>;
