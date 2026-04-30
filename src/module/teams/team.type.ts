import { Team } from "./team.model";

export interface TeamType
  extends Omit<Team, "created_at" | "updated_at" | "deleted_at"> {
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export type CreateTeamInput = Omit<
  Team,
  "id" | "created_at" | "updated_at" | "deleted_at" | "deleted_by"
>;

export type UpdateTeamInput = Partial<
  Omit<Team, "id" | "created_at" | "updated_at" | "deleted_at">
>;

export type TeamResponseType = {
  id: number;
  org_id: string;
  team_name: string;
  description?: string;
  team_head_id?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: Date;
  updated_at?: Date;
};
