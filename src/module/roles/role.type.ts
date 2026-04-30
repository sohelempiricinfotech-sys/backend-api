export interface CreateRoleInput {
  org_id: number;
  role: string;
  modules: string[];
  created_by: number;
  updated_by: number | null;
  deleted_by: number | null;
}

export interface UpdateRoleInput {
  role?: string;
  modules?: string[];
  updated_by?: number;
}
