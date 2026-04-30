export type MessageType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;

  // ---------- MESSAGE DETAILS ----------
  message: string | null;
  type: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateMessageInput = Omit<
  MessageType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateMessageInput = Partial<MessageType>;
