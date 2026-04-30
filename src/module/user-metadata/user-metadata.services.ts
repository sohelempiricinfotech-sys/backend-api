import { UserMetadata } from "./user-metadata.model";
import { AppDataSource } from "../../data-source";
import { CreateUserMetadataInput, UpdateUserMetadataInput } from "./user-metadata.type";

const userMetadataRepository = AppDataSource.getRepository(UserMetadata);

const updateMultipleUserMetadata = async (
  filter: object,
  update: object
) => {
  return await userMetadataRepository.update(filter, update);
};

const createUserMetadata = async (data: CreateUserMetadataInput) => {
  console.log("Creating user metadata with data (DB call):", data);
  const newUserMetadata = userMetadataRepository.create(data);
  return userMetadataRepository.save(newUserMetadata);
};

const getUserMetadata = async (filter: object) => {
  return userMetadataRepository.findBy(filter);
};

const deleteUserMetadata = async (filter: object, update: object) => {
  return userMetadataRepository.update(filter, update);
};

const updateUserMetadata = async (
  filter: object,
  data: UserMetadata,
  userMetadataData: UpdateUserMetadataInput
) => {
  const newData = userMetadataRepository.merge(data, userMetadataData);
  const updatedUserMetadata = await userMetadataRepository.save(newData);
  return await userMetadataRepository.update(filter, updatedUserMetadata);
};

const getUserMetadataOne = async (filter: object) => {
  console.log("Fetching user metadata with filter (DB call):", filter);
  return await userMetadataRepository.findOneBy(filter);
};

export {
  updateMultipleUserMetadata,
  createUserMetadata,
  getUserMetadata,
  deleteUserMetadata,
  updateUserMetadata,
  getUserMetadataOne,
};
