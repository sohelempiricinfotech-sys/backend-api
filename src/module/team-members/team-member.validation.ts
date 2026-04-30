import { z } from "zod";

export const createTeamMemberValidationSchema = z.object({
  org_id: z.string().uuid("Invalid org_id format"),
  team_id: z.string().uuid("Invalid team_id format"),
  user_id: z.string().uuid("Invalid user_id format"),
  reporting_user_id: z.string().uuid("Invalid reporting_user_id format").optional(),
  designation: z.string().max(100).optional(),
  is_active: z.boolean().default(true),
  created_by: z.string().optional(),
});

export const updateTeamMemberValidationSchema = z.object({
  team_id: z.string().uuid("Invalid team_id format").optional(),
  user_id: z.string().uuid("Invalid user_id format").optional(),
  reporting_user_id: z.string().uuid("Invalid reporting_user_id format").optional(),
  designation: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
  updated_by: z.string().optional(),
});

export type CreateTeamMemberValidation = z.infer<
  typeof createTeamMemberValidationSchema
>;
export type UpdateTeamMemberValidation = z.infer<
  typeof updateTeamMemberValidationSchema
>;
