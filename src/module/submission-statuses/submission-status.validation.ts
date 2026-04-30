import { z } from "zod";

export const createSubmissionStatusSchema = z.object({
  name: z.string().min(1, "Status name is required"),
  order: z.number().optional(),
});

export const updateSubmissionStatusSchema = z.object({
  name: z.string().min(1, "Status name is required").optional(),
  order: z.number().optional(),
});
