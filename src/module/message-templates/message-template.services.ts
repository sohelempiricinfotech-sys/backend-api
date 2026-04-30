import { MessageTemplate } from "./message-template.model";
import { AppDataSource } from "../../data-source";
import { CreateMessageTemplateInput, UpdateMessageTemplateInput } from "./message-template.type";
import { IsNull } from "typeorm";

const messageTemplateRepository = AppDataSource.getRepository(MessageTemplate);

const createMessageTemplate = async (data: CreateMessageTemplateInput) => {
  const newMessageTemplate = messageTemplateRepository.create(data);
  return messageTemplateRepository.save(newMessageTemplate);
};

const getMessageTemplates = async (filter: any) => {
  return messageTemplateRepository.findBy({ ...filter, deleted_at: IsNull() });
};

const getMessageTemplate = async (filter: any) => {
  return await messageTemplateRepository.findOneBy({ ...filter, deleted_at: IsNull() });
};

const updateMessageTemplate = async (
  data: MessageTemplate,
  messageTemplateData: UpdateMessageTemplateInput
) => {
  const newData = messageTemplateRepository.merge(data, messageTemplateData);
  return await messageTemplateRepository.save(newData);
};

const deleteMessageTemplate = async (filter: object, userId: number) => {
  return messageTemplateRepository.update(filter, {
    deleted_at: new Date(),
    deleted_by: userId,
  });
};

export {
  createMessageTemplate,
  getMessageTemplates,
  getMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
};
