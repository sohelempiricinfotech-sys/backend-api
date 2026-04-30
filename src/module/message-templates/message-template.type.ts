export type MessageTemplateType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number;

  // ---------- TEMPLATE DETAILS ----------
  name: string;
  type: string;
  subject: string | null;
  body: string;
  link_name: string | null;
  link_url: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateMessageTemplateInput = Omit<
  MessageTemplateType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateMessageTemplateInput = Partial<MessageTemplateType>;
