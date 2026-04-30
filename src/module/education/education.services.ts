import { Education } from "./education.model";
import { AppDataSource } from "../../data-source";
import { CreateEducationInput, UpdateEducationInput } from "./education.type";

const educationRepository = AppDataSource.getRepository(Education);

const updateMultipleEducations = async (
  filter: object,
  update: object
) => {
  return await educationRepository.update(filter, update);
};

const createEducation = async (data: CreateEducationInput) => {
  console.log("Creating education with data (DB call):", data);
  const newEducation = educationRepository.create(data);
  return educationRepository.save(newEducation);
};

const getEducations = async (filter: object) => {
  return educationRepository.findBy(filter);
};

const deleteEducation = async (filter: object, update: object) => {
  return educationRepository.update(filter, update);
};

const updateEducation = async (
  filter: object,
  data: Education,
  educationData: UpdateEducationInput
) => {
  const newData = educationRepository.merge(data, educationData);
  const updatedEducation = await educationRepository.save(newData);
  return await educationRepository.update(filter, updatedEducation);
};

const getEducation = async (filter: object) => {
  console.log("Fetching education with filter (DB call):", filter);
  return await educationRepository.findOneBy(filter);
};

export {
  updateMultipleEducations,
  createEducation,
  getEducations,
  deleteEducation,
  updateEducation,
  getEducation,
};
