import { Team } from "./team.model";
import { AppDataSource } from "../../data-source";
import { CreateTeamInput, UpdateTeamInput } from "./team.type";

const teamRepository = AppDataSource.getRepository(Team);

const updateMultipleTeams = async (filter: object, update: object) => {
  return await teamRepository.update(filter, update);
};

const createTeam = async (data: CreateTeamInput) => {
  console.log("Creating team with data (DB call):", data);
  const newTeam = teamRepository.create(data);
  return teamRepository.save(newTeam);
};

const getTeams = async (filter: object) => {
  return teamRepository.findBy(filter);
};

const deleteTeam = async (filter: object, update: object) => {
  return teamRepository.update(filter, update);
};

const updateTeam = async (
  filter: object,
  data: Team,
  teamData: UpdateTeamInput
) => {
  const newData = teamRepository.merge(data, teamData);
  const updatedTeam = await teamRepository.save(newData);
  return await teamRepository.update(filter, updatedTeam);
};

const getTeam = async (filter: object) => {
  console.log("Fetching team with filter (DB call):", filter);
  return await teamRepository.findOneBy(filter);
};

export {
  updateMultipleTeams,
  createTeam,
  getTeams,
  deleteTeam,
  updateTeam,
  getTeam,
};
