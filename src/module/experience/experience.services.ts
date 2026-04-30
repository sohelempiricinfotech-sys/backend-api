import { Experience } from "./experience.model";
import { AppDataSource } from "../../data-source";
import { CreateExperienceInput, UpdateExperienceInput } from "./experience.type";

const experienceRepository = AppDataSource.getRepository(Experience);

const updateMultipleExperiences = async (
  filter: object,
  update: object
) => {
  return await experienceRepository.update(filter, update);
};

const createExperience = async (data: CreateExperienceInput) => {
  console.log("Creating experience with data (DB call):", data);
  const newExperience = experienceRepository.create(data);
  return experienceRepository.save(newExperience);
};

const getExperiences = async (filter: object) => {
  return experienceRepository.findBy(filter);
};

const deleteExperience = async (filter: object, update: object) => {
  return experienceRepository.update(filter, update);
};

const updateExperience = async (
  filter: object,
  data: Experience,
  experienceData: UpdateExperienceInput
) => {
  const newData = experienceRepository.merge(data, experienceData);
  const updatedExperience = await experienceRepository.save(newData);
  return await experienceRepository.update(filter, updatedExperience);
};

const getExperience = async (filter: object) => {
  console.log("Fetching experience with filter (DB call):", filter);
  return await experienceRepository.findOneBy(filter);
};

export {
  updateMultipleExperiences,
  createExperience,
  getExperiences,
  deleteExperience,
  updateExperience,
  getExperience,
};
