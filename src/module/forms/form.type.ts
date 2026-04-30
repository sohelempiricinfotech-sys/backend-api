export type FormType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  owner_name_id: number | null;

  // ---------- FORM DETAILS ----------
  fields: Record<string, any> | null;
  type: string;
  description: string | null;
  title: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateFormInput = Omit<
  FormType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateFormInput = Partial<FormType>;
