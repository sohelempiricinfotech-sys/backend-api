import { UserActivity } from "./user-activity.model";
import { AppDataSource } from "../../data-source";
import { CreateUserActivityInput, UpdateUserActivityInput } from "./user-activity.type";

const userActivityRepository = AppDataSource.getRepository(UserActivity);

const updateMultipleUserActivities = async (
  filter: object,
  update: object
) => {
  return await userActivityRepository.update(filter, update);
};

const createUserActivity = async (data: CreateUserActivityInput) => {
  console.log("Creating user activity with data (DB call):", data);
  const newUserActivity = userActivityRepository.create(data);
  return userActivityRepository.save(newUserActivity);
};

const getUserActivities = async (filter: object) => {
  return userActivityRepository.findBy(filter);
};

const deleteUserActivity = async (filter: object, update: object) => {
  return userActivityRepository.update(filter, update);
};

const updateUserActivity = async (
  filter: object,
  data: UserActivity,
  userActivityData: UpdateUserActivityInput
) => {
  const newData = userActivityRepository.merge(data, userActivityData);
  const updatedUserActivity = await userActivityRepository.save(newData);
  return await userActivityRepository.update(filter, updatedUserActivity);
};

const getUserActivity = async (filter: object) => {
  console.log("Fetching user activity with filter (DB call):", filter);
  return await userActivityRepository.findOneBy(filter);
};

export {
  updateMultipleUserActivities,
  createUserActivity,
  getUserActivities,
  deleteUserActivity,
  updateUserActivity,
  getUserActivity,
};
