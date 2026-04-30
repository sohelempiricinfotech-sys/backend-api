import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z.string()
    .min(1, "Organization slug is required")
    .max(100, "Slug must be at most 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  plan_id: z.number().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().optional(),
  slug: z.string()
    .min(1, "Organization slug is required")
    .max(100, "Slug must be at most 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  plan_id: z.number().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateOrgSettingsSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(255).optional(),
  tagline: z.string().max(500).nullable().optional(),
  address: z.string().max(1000).nullable().optional(),
  social_x: z.string().url("Invalid URL").max(500).nullable().optional(),
  social_facebook: z.string().url("Invalid URL").max(500).nullable().optional(),
  social_instagram: z.string().url("Invalid URL").max(500).nullable().optional(),
  social_linkedin: z.string().url("Invalid URL").max(500).nullable().optional(),
  social_youtube: z.string().url("Invalid URL").max(500).nullable().optional(),
  social_whatsapp: z.string().url("Invalid URL").max(500).nullable().optional(),
});
