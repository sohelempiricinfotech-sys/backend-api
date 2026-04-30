import { OrgPermission } from "./org-permission.model";

export interface OrgPermissionType
  extends Omit<OrgPermission, "created_at" | "updated_at" | "deleted_at"> {
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export type CreateOrgPermissionInput = Omit<
  OrgPermission,
  "id" | "created_at" | "updated_at" | "deleted_at" | "deleted_by"
>;

export type UpdateOrgPermissionInput = Partial<
  Omit<OrgPermission, "id" | "created_at" | "updated_at" | "deleted_at">
>;

export type OrgPermissionResponseType = {
  id: number;
  org_id: string;
  permission_name: string;
  description?: string;
  modules: Record<string, any>;
  limits?: Record<string, number>;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: Date;
  updated_at?: Date;
};
