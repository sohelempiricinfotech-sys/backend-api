import { OrgPermission } from "./org-permission.model";
import { AppDataSource } from "../../data-source";
import { CreateOrgPermissionInput, UpdateOrgPermissionInput } from "./org-permission.type";

const orgPermissionRepository = AppDataSource.getRepository(OrgPermission);

const updateMultipleOrgPermissions = async (filter: object, update: object) => {
  return await orgPermissionRepository.update(filter, update);
};

const createOrgPermission = async (data: CreateOrgPermissionInput) => {
  console.log("Creating org permission with data (DB call):", data);
  const newOrgPermission = orgPermissionRepository.create(data);
  return orgPermissionRepository.save(newOrgPermission);
};

const getOrgPermissions = async (filter: object) => {
  return orgPermissionRepository.findBy(filter);
};

const deleteOrgPermission = async (filter: object, update: object) => {
  return orgPermissionRepository.update(filter, update);
};

const updateOrgPermission = async (
  filter: object,
  data: OrgPermission,
  orgPermissionData: UpdateOrgPermissionInput
) => {
  const newData = orgPermissionRepository.merge(data, orgPermissionData);
  const updatedOrgPermission = await orgPermissionRepository.save(newData);
  return await orgPermissionRepository.update(filter, updatedOrgPermission);
};

const getOrgPermission = async (filter: object) => {
  console.log("Fetching org permission with filter (DB call):", filter);
  return await orgPermissionRepository.findOneBy(filter);
};

export {
  updateMultipleOrgPermissions,
  createOrgPermission,
  getOrgPermissions,
  deleteOrgPermission,
  updateOrgPermission,
  getOrgPermission,
};
