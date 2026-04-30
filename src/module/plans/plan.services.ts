import { Plan } from "./plan.model";
import { AppDataSource } from "../../data-source";
import { CreatePlanInput, UpdatePlanInput } from "./plan.type";

const planRepository = AppDataSource.getRepository(Plan);

const updateMultiplePlans = async (filter: object, update: object) => {
  return await planRepository.update(filter, update);
};

const createPlan = async (data: CreatePlanInput) => {
  console.log("Creating plan with data (DB call):", data);
  const newPlan = planRepository.create(data);
  return planRepository.save(newPlan);
};

const getPlans = async (filter: object) => {
  return planRepository.findBy(filter);
};

const deletePlan = async (filter: object, update: object) => {
  return planRepository.update(filter, update);
};

const updatePlan = async (
  filter: object,
  data: Plan,
  planData: UpdatePlanInput
) => {
  const newData = planRepository.merge(data, planData);
  const updatedPlan = await planRepository.save(newData);
  return await planRepository.update(filter, updatedPlan);
};

const getPlan = async (filter: object) => {
  console.log("Fetching plan with filter (DB call):", filter);
  return await planRepository.findOneBy(filter);
};

export {
  updateMultiplePlans,
  createPlan,
  getPlans,
  deletePlan,
  updatePlan,
  getPlan,
};
