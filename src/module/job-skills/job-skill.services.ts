import { JobPostSkill } from "./job-skill.model";
import { AppDataSource } from "../../data-source";
import { CreateJobPostSkillInput, UpdateJobPostSkillInput } from "./job-skill.type";
import { Skill } from "../skills/skill.model";

const jobPostSkillRepository = AppDataSource.getRepository(JobPostSkill);
const skillRepository = AppDataSource.getRepository(Skill);

const updateMultipleJobPostSkills = async (
  filter: object,
  update: object
) => {
  return await jobPostSkillRepository.update(filter, update);
};

const createJobPostSkill = async (data: CreateJobPostSkillInput) => {
  console.log("Creating job post skill with data (DB call):", data);
  const newJobPostSkill = jobPostSkillRepository.create(data);
  return jobPostSkillRepository.save(newJobPostSkill);
};

const getJobPostSkills = async (filter: object) => {
  return jobPostSkillRepository.findBy(filter);
};

const getJobPostSkillsWithNames = async (jobPostId: string, orgId: number) => {
  const jobSkills = await jobPostSkillRepository.find({
    where: { job_post_id: jobPostId, org_id: orgId },
  });

  if (jobSkills.length === 0) return [];

  const skillIds = jobSkills.map((js) => js.skill_id);
  const skills = await skillRepository
    .createQueryBuilder("skill")
    .where("skill.id IN (:...skillIds)", { skillIds })
    .andWhere("skill.org_id = :orgId", { orgId })
    .andWhere("skill.deleted_at IS NULL")
    .getMany();

  return skills.map((skill) => ({
    value: String(skill.id),
    label: skill.name,
  }));
};

const deleteJobPostSkill = async (filter: object) => {
  return jobPostSkillRepository.delete(filter);
};

const updateJobPostSkill = async (
  filter: object,
  jobPostSkillData: UpdateJobPostSkillInput
) => {
  return await jobPostSkillRepository.update(filter, jobPostSkillData);
};

const getJobPostSkill = async (filter: object) => {
  console.log("Fetching job post skill with filter (DB call):", filter);
  return await jobPostSkillRepository.findOneBy(filter);
};

export {
  updateMultipleJobPostSkills,
  createJobPostSkill,
  getJobPostSkills,
  getJobPostSkillsWithNames,
  deleteJobPostSkill,
  updateJobPostSkill,
  getJobPostSkill,
};
