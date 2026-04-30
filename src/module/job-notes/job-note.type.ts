export type JobNoteType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  job_id: string;

  // ---------- NOTE DETAILS ----------
  job_note: string | null;
  note_submitter: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateJobNoteInput = Omit<
  JobNoteType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateJobNoteInput = Partial<JobNoteType>;
