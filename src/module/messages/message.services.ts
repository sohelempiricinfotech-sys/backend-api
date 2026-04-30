import { Message } from "./message.model";
import { AppDataSource } from "../../data-source";
import { CreateMessageInput, UpdateMessageInput } from "./message.type";

const messageRepository = AppDataSource.getRepository(Message);

const updateMultipleMessages = async (
  filter: object,
  update: object
) => {
  return await messageRepository.update(filter, update);
};

const createMessage = async (data: CreateMessageInput) => {
  console.log("Creating message with data (DB call):", data);
  const newMessage = messageRepository.create(data);
  return messageRepository.save(newMessage);
};

const getMessages = async (filter: object) => {
  return messageRepository.findBy(filter);
};

const deleteMessage = async (filter: object, update: object) => {
  return messageRepository.update(filter, update);
};

const updateMessage = async (
  filter: object,
  data: Message,
  messageData: UpdateMessageInput
) => {
  const newData = messageRepository.merge(data, messageData);
  const updatedMessage = await messageRepository.save(newData);
  return await messageRepository.update(filter, updatedMessage);
};

const getMessage = async (filter: object) => {
  console.log("Fetching message with filter (DB call):", filter);
  return await messageRepository.findOneBy(filter);
};

export {
  updateMultipleMessages,
  createMessage,
  getMessages,
  deleteMessage,
  updateMessage,
  getMessage,
};
