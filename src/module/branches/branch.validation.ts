import { z } from "zod";

export const createBranchSchema = z.object({
    branch_name: z.string().min(2, "Branch name must be at least 2 characters"),
    branch_code: z.string().max(50).optional().nullable(),
    address_line_1: z.string().max(255).optional().nullable(),
    address_line_2: z.string().max(255).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    pincode: z.string().max(20).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email("Invalid email").optional().nullable(),
    status: z.string().max(50).optional(),
});

export const updateBranchSchema = z.object({
    branch_name: z.string().min(2, "Branch name must be at least 2 characters").optional(),
    branch_code: z.string().max(50).optional().nullable(),
    address_line_1: z.string().max(255).optional().nullable(),
    address_line_2: z.string().max(255).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    pincode: z.string().max(20).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email("Invalid email").optional().nullable(),
    status: z.string().max(50).optional(),
});
