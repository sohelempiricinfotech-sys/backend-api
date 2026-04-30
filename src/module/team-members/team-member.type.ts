import { TeamMember } from "./team-member.model";

export interface TeamMemberType
  extends Omit<TeamMember, "created_at" | "updated_at" | "deleted_at"> {
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export type CreateTeamMemberInput = Omit<
  TeamMember,
  "id" | "created_at" | "updated_at" | "deleted_at" | "deleted_by"
>;

export type UpdateTeamMemberInput = Partial<
  Omit<TeamMember, "id" | "created_at" | "updated_at" | "deleted_at">
>;

export type TeamMemberResponseType = {
  id: number;
  org_id: string;
  team_id: string;
  user_id: string;
  reporting_user_id?: string;
  designation?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: Date;
  updated_at?: Date;
};
