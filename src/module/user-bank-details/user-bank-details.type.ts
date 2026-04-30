export type UserBankDetailsType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number;

  // ---------- BANK DETAILS ----------
  bank_account_number: string | null;
  ifsc_code: string | null;
  bank_name: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateUserBankDetailsInput = Omit<
  UserBankDetailsType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateUserBankDetailsInput = Partial<UserBankDetailsType>;
