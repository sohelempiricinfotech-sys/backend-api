import { z } from "zod";

export const createJobNoteSchema = z.object({
  org_id: z.number().positive("Organization ID must be a positive number"),
  job_id: z.number().positive("Job ID must be a positive number"),
  job_note: z.string().optional(),
  note_submitter: z.string().optional(),

  // ---------- AUDIT ----------
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});

export const updateJobNoteSchema = z.object({
  org_id: z.number().optional(),
  job_id: z.number().optional(),
  job_note: z.string().optional(),
  note_submitter: z.string().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  deleted_by: z.number().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
});
