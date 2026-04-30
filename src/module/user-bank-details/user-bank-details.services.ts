import { UserBankDetails } from "./user-bank-details.model";
import { AppDataSource } from "../../data-source";
import { CreateUserBankDetailsInput, UpdateUserBankDetailsInput } from "./user-bank-details.type";

const userBankDetailsRepository = AppDataSource.getRepository(UserBankDetails);

const updateMultipleUserBankDetails = async (
  filter: object,
  update: object
) => {
  return await userBankDetailsRepository.update(filter, update);
};

const createUserBankDetails = async (data: CreateUserBankDetailsInput) => {
  console.log("Creating user bank details with data (DB call):", data);
  const newUserBankDetails = userBankDetailsRepository.create(data);
  return userBankDetailsRepository.save(newUserBankDetails);
};

const getUserBankDetails = async (filter: object) => {
  return userBankDetailsRepository.findBy(filter);
};

const deleteUserBankDetails = async (filter: object, update: object) => {
  return userBankDetailsRepository.update(filter, update);
};

const updateUserBankDetails = async (
  filter: object,
  data: UserBankDetails,
  userBankDetailsData: UpdateUserBankDetailsInput
) => {
  const newData = userBankDetailsRepository.merge(data, userBankDetailsData);
  const updatedUserBankDetails = await userBankDetailsRepository.save(newData);
  return await userBankDetailsRepository.update(filter, updatedUserBankDetails);
};

const getUserBankDetailsOne = async (filter: object) => {
  console.log("Fetching user bank details with filter (DB call):", filter);
  return await userBankDetailsRepository.findOneBy(filter);
};

export {
  updateMultipleUserBankDetails,
  createUserBankDetails,
  getUserBankDetails,
  deleteUserBankDetails,
  updateUserBankDetails,
  getUserBankDetailsOne,
};
