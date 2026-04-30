import { Resume } from "./resume.model";
import { AppDataSource } from "../../data-source";
import { CreateResumeInput, UpdateResumeInput } from "./resume.type";

const resumeRepository = AppDataSource.getRepository(Resume);

const updateMultipleResumes = async (
  filter: object,
  update: object
) => {
  return await resumeRepository.update(filter, update);
};

const createResume = async (data: CreateResumeInput) => {
  console.log("Creating resume with data (DB call):", data);
  const newResume = resumeRepository.create(data);
  return resumeRepository.save(newResume);
};

const getResumes = async (filter: object) => {
  return resumeRepository.findBy(filter);
};

const deleteResume = async (filter: object, update: object) => {
  return resumeRepository.update(filter, update);
};

const updateResume = async (
  filter: object,
  data: Resume,
  resumeData: UpdateResumeInput
) => {
  const newData = resumeRepository.merge(data, resumeData);
  const updatedResume = await resumeRepository.save(newData);
  return await resumeRepository.update(filter, updatedResume);
};

const getResume = async (filter: object) => {
  console.log("Fetching resume with filter (DB call):", filter);
  return await resumeRepository.findOneBy(filter);
};

export {
  updateMultipleResumes,
  createResume,
  getResumes,
  deleteResume,
  updateResume,
  getResume,
};
