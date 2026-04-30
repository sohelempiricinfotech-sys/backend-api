import { z } from "zod";

export const createContactSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().optional(),
    email: z.string({ required_error: "Email is required" }).email("Invalid email format").transform(val => val.toLowerCase()),
    phone: z.string().optional().nullable(),
});

export const updateContactSchema = z.object({
    first_name: z.string().min(1).optional(),
    last_name: z.string().optional(),
    email: z.string().email("Invalid email format").transform(val => val.toLowerCase()).optional(),
    phone: z.string().optional().nullable(),
});
