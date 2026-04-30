import { Role } from "./role.model";
import { AppDataSource } from "../../data-source";
import { IsNull } from "typeorm";
import { CreateRoleInput, UpdateRoleInput } from "./role.type";

const roleRepository = AppDataSource.getRepository(Role);

const createRole = async (data: CreateRoleInput) => {
  const newRole = roleRepository.create(data);
  return await roleRepository.save(newRole);
};

const updateRole = async (
  data: Role,
  roleData: UpdateRoleInput
) => {
  const newData = roleRepository.merge(data, roleData);
  const updatedRole = await roleRepository.save(newData);
  return updatedRole;
};

const deleteRole = async (filter: object, userId: number) => {
  return await roleRepository.update(filter, {
    deleted_at: new Date(),
    deleted_by: userId,
  });
};

const getRoles = async (filter: any) => {
  return await roleRepository.findBy({ ...filter, deleted_at: IsNull() });
};

const getRole = async (filter: any) => {
  return await roleRepository.findOneBy({ ...filter, deleted_at: IsNull() });
};

export {
  createRole,
  updateRole,
  deleteRole,
  getRoles,
  getRole,
};
