import { z } from "zod";

export const updateProfileSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  designation: z.string().optional().nullable(),
  experience_years: z.number().min(0).optional().nullable(),
  notice_period: z.number().int().min(0).optional().nullable(),
  short_summary: z.string().optional().nullable(),
  objectives: z.array(z.string()).optional().nullable(),
  industry_id: z.number().int().positive().optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
  skills: z.array(z.number().int().positive()).optional(),
  metadata: z
    .object({
      gender: z.string().optional().nullable(),
      date_of_birth: z.string().optional().nullable(),
      address_line_1: z.string().optional().nullable(),
      address_line_2: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      pincode: z.string().optional().nullable(),
      country: z.string().optional().nullable(),
      aadhar_card_number: z.string().optional().nullable(),
      pan_card_number: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  resumes: z
    .array(
      z.object({
        file_name: z.string(),
        file_path: z.string(),
      })
    )
    .optional(),
  experiences: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        isDeleted: z.boolean().optional(),
        job_title: z.string().optional().nullable(),
        company_name: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
        start_date: z.string().optional().nullable(),
        end_date: z.string().optional().nullable(),
        is_present: z.boolean().optional(),
        description: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required."),
  new_password: z.string().min(6, "New password must be at least 6 characters."),
});
