import { z } from "zod";

export const createClientSchema = z.object({
    client_name: z.string().min(2, "Client name must be at least 2 characters"),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email("Invalid email").optional().nullable(),
    website: z.string().max(500).optional().nullable(),
    status: z.string().max(50).optional(),
    description: z.string().optional().nullable(),
    industry_id: z.number().optional().nullable(),
});

export const updateClientSchema = z.object({
    client_name: z.string().min(2, "Client name must be at least 2 characters").optional(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email("Invalid email").optional().nullable(),
    website: z.string().max(500).optional().nullable(),
    status: z.string().max(50).optional(),
    description: z.string().optional().nullable(),
    industry_id: z.number().optional().nullable(),
});
