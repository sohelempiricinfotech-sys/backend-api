import { z } from "zod";

export const createOrgPermissionValidationSchema = z.object({
  org_id: z.string().uuid("Invalid org_id format"),
  permission_name: z.string().min(1, "Permission name is required").max(255),
  description: z.string().optional(),
  modules: z.record(z.string(), z.any()),
  limits: z.record(z.string(), z.number()).optional(),
  is_active: z.boolean().default(true),
  created_by: z.string().optional(),
});

export const updateOrgPermissionValidationSchema = z.object({
  permission_name: z.string().min(1, "Permission name is required").max(255).optional(),
  description: z.string().optional(),
  modules: z.record(z.string(), z.any()).optional(),
  limits: z.record(z.string(), z.number()).optional(),
  is_active: z.boolean().optional(),
  updated_by: z.string().optional(),
});

export type CreateOrgPermissionValidation = z.infer<
  typeof createOrgPermissionValidationSchema
>;
export type UpdateOrgPermissionValidation = z.infer<
  typeof updateOrgPermissionValidationSchema
>;
