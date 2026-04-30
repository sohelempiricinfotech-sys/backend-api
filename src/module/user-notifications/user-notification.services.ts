import { UserNotification } from "./user-notification.model";
import { AppDataSource } from "../../data-source";
import { CreateUserNotificationInput, UpdateUserNotificationInput } from "./user-notification.type";

const userNotificationRepository = AppDataSource.getRepository(UserNotification);

const updateMultipleUserNotifications = async (
  filter: object,
  update: object
) => {
  return await userNotificationRepository.update(filter, update);
};

const createUserNotification = async (data: CreateUserNotificationInput) => {
  console.log("Creating user notification with data (DB call):", data);
  const newUserNotification = userNotificationRepository.create(data);
  return userNotificationRepository.save(newUserNotification);
};

const getUserNotifications = async (filter: object) => {
  return userNotificationRepository.findBy(filter);
};

const deleteUserNotification = async (filter: object, update: object) => {
  return userNotificationRepository.update(filter, update);
};

const updateUserNotification = async (
  filter: object,
  data: UserNotification,
  userNotificationData: UpdateUserNotificationInput
) => {
  const newData = userNotificationRepository.merge(data, userNotificationData);
  const updatedUserNotification = await userNotificationRepository.save(newData);
  return await userNotificationRepository.update(filter, updatedUserNotification);
};

const getUserNotification = async (filter: object) => {
  console.log("Fetching user notification with filter (DB call):", filter);
  return await userNotificationRepository.findOneBy(filter);
};

export {
  updateMultipleUserNotifications,
  createUserNotification,
  getUserNotifications,
  deleteUserNotification,
  updateUserNotification,
  getUserNotification,
};
