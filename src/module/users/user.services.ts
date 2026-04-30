import { User } from "./user.model";
import { AppDataSource } from "../../data-source";
import { CreateUserInput, UpdateUserInput } from "./user.type";
import { IsNull } from "typeorm";

const userRepository = AppDataSource.getRepository(User);

const updateMultipleUsers = async (filter: object, update: object) => {
  return await userRepository.update(filter, update);
};

const createUser = async (data: CreateUserInput) => {
  const newUser = userRepository.create(data);
  return userRepository.save(newUser);
};

const getUsers = async (user: object) => {
  return userRepository.find(user);
};

const getUsersList = async (
  orgId: number,
  options: {
    page: number;
    limit: number;
    search?: string;
    system_role?: string;
  }
) => {
  const { page, limit, search, system_role } = options;
  const skip = (page - 1) * limit;

  const queryBuilder = userRepository
    .createQueryBuilder("user")
    .select([
      "user.id",
      "user.first_name",
      "user.last_name",
      "user.email",
      "user.phone",
      "user.system_role",
      "user.status",
      "user.created_at",
    ])
    .where("user.org_id = :orgId", { orgId })
    .andWhere("user.deleted_at IS NULL")
    .andWhere("user.system_role IN (:...roles)", { roles: ["org_admin", "employee"] });

  if (search) {
    queryBuilder.andWhere(
      "(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)",
      { search: `%${search}%` }
    );
  }

  if (system_role) {
    queryBuilder.andWhere("user.system_role = :system_role", { system_role });
  }

  queryBuilder
    .orderBy("user.created_at", "DESC")
    .skip(skip)
    .take(limit);

  const [users, total] = await queryBuilder.getManyAndCount();
  const hasMore = skip + users.length < total;
  const totalPages = Math.ceil(total / limit);

  return { users, total, hasMore, totalPages };
};

const deleteUser = async (filter: object, update: object) => {
  return userRepository.update(filter, update);
};

const updateUser = async (
  filter: object,
  data: User,
  userdata: UpdateUserInput
) => {
  const newData = userRepository.merge(data, userdata);
  const updatedUser = await userRepository.save(newData);
  return await userRepository.update(filter, updatedUser);
};

const getUser = async (filter: object) => {
  return await userRepository.findOneBy(filter);
};

const getUserUuidId = async (userId: number, orgId: number): Promise<string | null> => {
  const user = await userRepository.findOne({
    where: { id: userId, org_id: orgId, deleted_at: IsNull() },
    select: ["uuid_id"],
  });
  return user?.uuid_id ?? null;
};

export {
  updateMultipleUsers,
  createUser,
  getUsers,
  getUsersList,
  deleteUser,
  updateUser,
  getUser,
  getUserUuidId,
};
