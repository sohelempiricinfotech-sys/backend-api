import { z } from "zod";

export const createUserNoteSchema = z.object({
  org_id: z.number().positive("Organization ID must be a positive number"),
  user_id: z.number().optional(),
  note: z.string().optional(),
  is_call: z.boolean().default(false).optional(),
  note_submitter: z.string().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateUserNoteSchema = z.object({
  org_id: z.number().optional(),
  user_id: z.number().optional(),
  note: z.string().optional(),
  is_call: z.boolean().optional(),
  note_submitter: z.string().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
