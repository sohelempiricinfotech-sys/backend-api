import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    client_id: z.number().optional().nullable(),
    assignee_ids: z.array(z.number()).optional().nullable(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1, "Project name is required").optional(),
    client_id: z.number().optional().nullable(),
    assignee_ids: z.array(z.number()).optional().nullable(),
});
