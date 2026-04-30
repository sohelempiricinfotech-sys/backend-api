import { AppDataSource } from "../../data-source";
import { User, SystemRole } from "../../module/users/user.model";
import { Organization } from "../../module/organizations/organization.model";

const userRepository = AppDataSource.getRepository(User);
const organizationRepository = AppDataSource.getRepository(Organization);

export const getOrganizationBySlug = async (slug: string) => {
  return organizationRepository.findOneBy({ slug });
};

export const getCandidateUser = async (filter: object) => {
  return userRepository.findOneBy({
    ...filter,
    system_role: SystemRole.CANDIDATE,
  });
};

export const createCandidateUser = async (data: Partial<User>) => {
  const newUser = userRepository.create({
    ...data,
    system_role: SystemRole.CANDIDATE,
  });
  return userRepository.save(newUser);
};

export const updateCandidateUser = async (filter: object, update: object) => {
  return userRepository.update(filter, update);
};
