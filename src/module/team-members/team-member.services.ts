import { TeamMember } from "./team-member.model";
import { AppDataSource } from "../../data-source";
import { CreateTeamMemberInput, UpdateTeamMemberInput } from "./team-member.type";

const teamMemberRepository = AppDataSource.getRepository(TeamMember);

const updateMultipleTeamMembers = async (filter: object, update: object) => {
  return await teamMemberRepository.update(filter, update);
};

const createTeamMember = async (data: CreateTeamMemberInput) => {
  console.log("Creating team member with data (DB call):", data);
  const newTeamMember = teamMemberRepository.create(data);
  return teamMemberRepository.save(newTeamMember);
};

const getTeamMembers = async (filter: object) => {
  return teamMemberRepository.findBy(filter);
};

const deleteTeamMember = async (filter: object, update: object) => {
  return teamMemberRepository.update(filter, update);
};

const updateTeamMember = async (
  filter: object,
  data: TeamMember,
  teamMemberData: UpdateTeamMemberInput
) => {
  const newData = teamMemberRepository.merge(data, teamMemberData);
  const updatedTeamMember = await teamMemberRepository.save(newData);
  return await teamMemberRepository.update(filter, updatedTeamMember);
};

const getTeamMember = async (filter: object) => {
  console.log("Fetching team member with filter (DB call):", filter);
  return await teamMemberRepository.findOneBy(filter);
};

export {
  updateMultipleTeamMembers,
  createTeamMember,
  getTeamMembers,
  deleteTeamMember,
  updateTeamMember,
  getTeamMember,
};
