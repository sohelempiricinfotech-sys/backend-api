export type UserMetadataType = {
  id: number;

  // ---------- RELATION FIELDS ----------
  org_id: number;
  user_id: number;

  // ---------- PERSONAL DETAILS ----------
  gender: string | null;
  date_of_birth: string | null;

  // ---------- ADDRESS ----------
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;

  // ---------- GOVERNMENT IDS ----------
  aadhar_card_number: string | null;
  pan_card_number: string | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateUserMetadataInput = Omit<
  UserMetadataType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateUserMetadataInput = Partial<UserMetadataType>;
