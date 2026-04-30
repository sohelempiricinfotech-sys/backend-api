import { z } from "zod";

export const createMessageTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  link_name: z.string().optional(),
  link_url: z.string().url("Link URL must be a valid URL").optional().or(z.literal("")),
});

export const updateMessageTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").optional(),
  subject: z.string().optional(),
  body: z.string().min(1, "Body is required").optional(),
  link_name: z.string().optional(),
  link_url: z.string().url("Link URL must be a valid URL").optional().or(z.literal("")),
});
