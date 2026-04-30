import { z } from "zod";

export const createUserBankDetailsSchema = z.object({
  org_id: z.number().optional(),
  user_id: z.number().positive("User ID must be a positive number"),
  bank_account_number: z.string().optional(),
  ifsc_code: z.string().optional(),
  bank_name: z.string().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateUserBankDetailsSchema = z.object({
  org_id: z.number().optional(),
  user_id: z.number().optional(),
  bank_account_number: z.string().optional(),
  ifsc_code: z.string().optional(),
  bank_name: z.string().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
