import { Source } from "./source.model";
import { AppDataSource } from "../../data-source";
import { CreateSourceInput, UpdateSourceInput } from "./source.type";

const sourceRepository = AppDataSource.getRepository(Source);

const updateMultipleSources = async (
  filter: object,
  update: object
) => {
  return await sourceRepository.update(filter, update);
};

const createSource = async (data: CreateSourceInput) => {
  console.log("Creating source with data (DB call):", data);
  const newSource = sourceRepository.create(data);
  return sourceRepository.save(newSource);
};

import { IsNull } from "typeorm";

const getSources = async (filter: any) => {
  return sourceRepository.findBy({ ...filter, deleted_at: IsNull() });
};

const deleteSource = async (filter: object, userId: number) => {
  return sourceRepository.update(filter, {
    deleted_at: new Date(),
    deleted_by: userId,
  });
};

const updateSource = async (
  data: Source,
  sourceData: UpdateSourceInput
) => {
  const newData = sourceRepository.merge(data, sourceData);
  const updatedSource = await sourceRepository.save(newData);
  return updatedSource;
};

const getSource = async (filter: any) => {
  console.log("Fetching source with filter (DB call):", filter);
  return await sourceRepository.findOneBy({ ...filter, deleted_at: IsNull() });
};

const getSourceByName = async (name: string, orgId: number) => {
  return sourceRepository
    .createQueryBuilder("source")
    .where("LOWER(source.source) = LOWER(:name)", { name })
    .andWhere("source.org_id = :orgId", { orgId })
    .andWhere("source.deleted_at IS NULL")
    .getOne();
};

export {
  updateMultipleSources,
  createSource,
  getSources,
  deleteSource,
  updateSource,
  getSource,
  getSourceByName,
};
