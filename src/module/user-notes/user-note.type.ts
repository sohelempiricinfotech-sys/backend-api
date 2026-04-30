import { NoteType } from "./user-note.model";

// that all note types use for user status
export type UserNoteTypes = "note" | "create" | "update" | "delete";

export type UserNoteType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number | null;

  // ---------- NOTE DETAILS ----------
  note: string | null;
  type: UserNoteTypes;
  note_type: NoteType;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateUserNoteInput = Omit<
  UserNoteType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateUserNoteInput = Partial<UserNoteType>;
