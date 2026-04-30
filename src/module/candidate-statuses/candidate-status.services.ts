import { CandidateStatus } from "./candidate-status.model";
import { AppDataSource } from "../../data-source";
import { CreateCandidateStatusInput, UpdateCandidateStatusInput } from "./candidate-status.type";

const candidateStatusRepository = AppDataSource.getRepository(CandidateStatus);

const updateMultipleCandidateStatuses = async (
  filter: object,
  update: object
) => {
  return await candidateStatusRepository.update(filter, update);
};

const createCandidateStatus = async (data: CreateCandidateStatusInput) => {
  console.log("Creating candidate status with data (DB call):", data);
  const newCandidateStatus = candidateStatusRepository.create(data);
  return candidateStatusRepository.save(newCandidateStatus);
};

const getCandidateStatuses = async (filter: object) => {
  return candidateStatusRepository.findBy(filter);
};

const deleteCandidateStatus = async (filter: object, update: object) => {
  return candidateStatusRepository.update(filter, update);
};

const updateCandidateStatus = async (
  filter: object,
  data: CandidateStatus,
  candidateStatusData: UpdateCandidateStatusInput
) => {
  const newData = candidateStatusRepository.merge(data, candidateStatusData);
  const updatedCandidateStatus = await candidateStatusRepository.save(newData);
  return await candidateStatusRepository.update(filter, updatedCandidateStatus);
};

const getCandidateStatus = async (filter: object) => {
  console.log("Fetching candidate status with filter (DB call):", filter);
  return await candidateStatusRepository.findOneBy(filter);
};

export {
  updateMultipleCandidateStatuses,
  createCandidateStatus,
  getCandidateStatuses,
  deleteCandidateStatus,
  updateCandidateStatus,
  getCandidateStatus,
};
