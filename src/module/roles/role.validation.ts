import { z } from "zod";

export const createRoleSchema = z.object({
    org_id: z.number().positive("Organization ID must be a positive number").optional(),
    role: z.string().min(1, "Role name is required"),
    modules: z.array(z.string()).min(1, "At least one module permission is required"),
});

export const updateRoleSchema = z.object({
    org_id: z.number().optional(),
    role: z.string().optional(),
    modules: z.array(z.string()).optional(),
});
