import { Industry } from "./industry.model";
import { AppDataSource } from "../../data-source";
import { CreateIndustryInput, UpdateIndustryInput } from "./industry.type";

const industryRepository = AppDataSource.getRepository(Industry);

const updateMultipleIndustries = async (
  filter: object,
  update: object
) => {
  return await industryRepository.update(filter, update);
};

const createIndustry = async (data: CreateIndustryInput) => {
  console.log("Creating industry with data (DB call):", data);
  const newIndustry = industryRepository.create(data);
  return industryRepository.save(newIndustry);
};

import { IsNull } from "typeorm";

const getIndustries = async (filter: any) => {
  return industryRepository.findBy({ ...filter, deleted_at: IsNull() });
};

const deleteIndustry = async (filter: object, userId: number) => {
  return industryRepository.update(filter, {
    deleted_at: new Date(),
    deleted_by: userId,
  });
};

const updateIndustry = async (
  data: Industry,
  industryData: UpdateIndustryInput
) => {
  const newData = industryRepository.merge(data, industryData);
  const updatedIndustry = await industryRepository.save(newData);
  return updatedIndustry;
};

const getIndustry = async (filter: any) => {
  console.log("Fetching industry with filter (DB call):", filter);
  return await industryRepository.findOneBy({ ...filter, deleted_at: IsNull() });
};

export {
  updateMultipleIndustries,
  createIndustry,
  getIndustries,
  deleteIndustry,
  updateIndustry,
  getIndustry,
};
