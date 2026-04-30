export type OrganizationType = {
  id: number;

  org_id: number;

  // ---------- BASIC ORGANIZATION INFO ----------
  name: string;
  slug: string;
  tagline: string | null;
  address: string | null;
  has_logo: boolean;

  // ---------- SOCIAL HANDLES ----------
  social_x: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  social_whatsapp: string | null;

  // ---------- RELATION FIELDS ----------
  plan_id: number | null;

  // ---------- AUDIT TRAIL ----------
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type CreateOrganizationInput = Omit<
  OrganizationType,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateOrganizationInput = Partial<OrganizationType>;
