import { User } from "../users/user.model";
import { Organization } from "../organizations/organization.model";
import { AppDataSource } from "../../data-source";

const userRepository = AppDataSource.getRepository(User);
const organizationRepository = AppDataSource.getRepository(Organization);

const updateUser = async (filter: object, update: object) => {
  return await userRepository.update(filter, update);
};

const getUser = async (filter: object) => {
  return await userRepository.findOneBy(filter);
};

const getOrganizationBySlug = async (slug: string) => {
  return await organizationRepository.findOneBy({ slug, deleted_by: undefined });
};

export { updateUser, getUser, getOrganizationBySlug };
