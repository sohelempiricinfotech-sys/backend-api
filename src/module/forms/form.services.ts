import { Form } from "./form.model";
import { AppDataSource } from "../../data-source";
import { CreateFormInput, UpdateFormInput } from "./form.type";

const formRepository = AppDataSource.getRepository(Form);

const updateMultipleForms = async (filter: object, update: object) => {
  return await formRepository.update(filter, update);
};

const createForm = async (data: CreateFormInput) => {
  console.log("Creating form with data (DB call):", data);
  const newForm = formRepository.create(data);
  return formRepository.save(newForm);
};

const getForms = async (filter: object) => {
  return formRepository.findBy(filter);
};

const deleteForm = async (filter: object, update: object) => {
  return formRepository.update(filter, update);
};

const updateForm = async (
  filter: object,
  data: Form,
  formData: UpdateFormInput
) => {
  const newData = formRepository.merge(data, formData);
  const updatedForm = await formRepository.save(newData);
  return await formRepository.update(filter, updatedForm);
};

const getForm = async (filter: object) => {
  console.log("Fetching form with filter (DB call):", filter);
  return await formRepository.findOneBy(filter);
};

export {
  updateMultipleForms,
  createForm,
  getForms,
  deleteForm,
  updateForm,
  getForm,
};
