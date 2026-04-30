import { UserNote } from "./user-note.model";
import { AppDataSource } from "../../data-source";
import { CreateUserNoteInput, UpdateUserNoteInput } from "./user-note.type";

const userNoteRepository = AppDataSource.getRepository(UserNote);

const updateMultipleUserNotes = async (
  filter: object,
  update: object
) => {
  return await userNoteRepository.update(filter, update);
};

const createUserNote = async (data: CreateUserNoteInput) => {
  console.log("Creating user note with data (DB call):", data);
  const newUserNote = userNoteRepository.create(data);
  return userNoteRepository.save(newUserNote);
};

const getUserNotes = async (filter: object) => {
  return userNoteRepository.findBy(filter);
};

const deleteUserNote = async (filter: object, update: object) => {
  return userNoteRepository.update(filter, update);
};

const updateUserNote = async (
  filter: object,
  data: UserNote,
  userNoteData: UpdateUserNoteInput
) => {
  const newData = userNoteRepository.merge(data, userNoteData);
  const updatedUserNote = await userNoteRepository.save(newData);
  return await userNoteRepository.update(filter, updatedUserNote);
};

const getUserNote = async (filter: object) => {
  console.log("Fetching user note with filter (DB call):", filter);
  return await userNoteRepository.findOneBy(filter);
};

export {
  updateMultipleUserNotes,
  createUserNote,
  getUserNotes,
  deleteUserNote,
  updateUserNote,
  getUserNote,
};
