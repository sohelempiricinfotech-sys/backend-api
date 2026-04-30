import { Skill } from "./skill.model";
import { AppDataSource } from "../../data-source";
import { CreateSkillInput, UpdateSkillInput } from "./skill.type";
import { IsNull } from "typeorm";

const skillRepository = AppDataSource.getRepository(Skill);

const updateMultipleSkills = async (
  filter: object,
  update: object
) => {
  return await skillRepository.update(filter, update);
};

const createSkill = async (data: CreateSkillInput) => {
  console.log("Creating skill with data (DB call):", data);
  const newSkill = skillRepository.create(data);
  return skillRepository.save(newSkill);
};

const getSkills = async (filter: any) => {
  return skillRepository.findBy({ ...filter, deleted_at: IsNull() });
};

const getSkillsList = async (
  orgId: number,
  options: { page: number; limit: number; search?: string }
) => {
  const { page, limit, search } = options;
  const skip = (page - 1) * limit;

  const queryBuilder = skillRepository
    .createQueryBuilder("skill")
    .where("skill.org_id = :orgId", { orgId })
    .andWhere("skill.deleted_at IS NULL");

  if (search) {
    queryBuilder.andWhere("skill.lower_name LIKE :search", {
      search: `%${search.toLowerCase().replace(/[- .]/g, "")}%`,
    });
  }

  queryBuilder
    .orderBy("skill.name", "ASC")
    .skip(skip)
    .take(limit);

  const [skills, total] = await queryBuilder.getManyAndCount();
  const isLast = skip + skills.length >= total;

  return { skills, total, isLast };
};

const deleteSkill = async (filter: object, userId: number) => {
  return skillRepository.update(filter, {
    deleted_by: userId,
    deleted_at: new Date(),
  });
};

const updateSkill = async (
  data: Skill,
  skillData: UpdateSkillInput
) => {
  const newData = skillRepository.merge(data, skillData);
  const updatedSkill = await skillRepository.save(newData);
};

const getSkill = async (filter: any) => {
  console.log("Fetching skill with filter (DB call):", filter);
  return await skillRepository.findOneBy({ ...filter, deleted_at: IsNull() });
};

const getSkillLowerName = (name: string) => {
  // remove - space . and convert to lowercase
  return name.replace(/[- .]/g, "").toLowerCase();
};

const findOrCreateSkill = async (
  skillName: string,
  orgId: number
): Promise<{ id: number; name: string; lower_name: string }> => {
  const lowerName = getSkillLowerName(skillName);

  // Try to find existing skill by lower_name and org_id
  const existingSkill = await skillRepository.findOneBy({
    lower_name: lowerName,
    org_id: orgId,
    deleted_at: IsNull(),
  });

  if (existingSkill) {
    const { id, name, lower_name } = existingSkill;
    return { id, name, lower_name };
  }

  // Create new skill if not found
  const newSkill = skillRepository.create({
    name: skillName,
    lower_name: lowerName,
    org_id: orgId,
  });

  const saved = await skillRepository.save(newSkill);
  const { id, name, lower_name } = saved;
  return { id, name, lower_name };
}

export {
  updateMultipleSkills,
  createSkill,
  getSkills,
  getSkillsList,
  deleteSkill,
  updateSkill,
  getSkill,
  getSkillLowerName,
  findOrCreateSkill,
};
