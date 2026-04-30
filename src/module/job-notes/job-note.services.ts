import { JobNote } from "./job-note.model";
import { AppDataSource } from "../../data-source";
import { CreateJobNoteInput, UpdateJobNoteInput } from "./job-note.type";

const jobNoteRepository = AppDataSource.getRepository(JobNote);

const updateMultipleJobNotes = async (
  filter: object,
  update: object
) => {
  return await jobNoteRepository.update(filter, update);
};

const createJobNote = async (data: CreateJobNoteInput) => {
  console.log("Creating job note with data (DB call):", data);
  const newJobNote = jobNoteRepository.create(data);
  return jobNoteRepository.save(newJobNote);
};

const getJobNotes = async (filter: object) => {
  return jobNoteRepository.findBy(filter);
};

const deleteJobNote = async (filter: object, update: object) => {
  return jobNoteRepository.update(filter, update);
};

const updateJobNote = async (
  filter: object,
  data: JobNote,
  jobNoteData: UpdateJobNoteInput
) => {
  const newData = jobNoteRepository.merge(data, jobNoteData);
  const updatedJobNote = await jobNoteRepository.save(newData);
  return await jobNoteRepository.update(filter, updatedJobNote);
};

const getJobNote = async (filter: object) => {
  console.log("Fetching job note with filter (DB call):", filter);
  return await jobNoteRepository.findOneBy(filter);
};

export {
  updateMultipleJobNotes,
  createJobNote,
  getJobNotes,
  deleteJobNote,
  updateJobNote,
  getJobNote,
};
