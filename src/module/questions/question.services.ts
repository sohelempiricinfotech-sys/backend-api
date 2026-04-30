import { Question } from "./question.model";
import { AppDataSource } from "../../data-source";
import { CreateQuestionInput, UpdateQuestionInput } from "./question.type";
import { IsNull } from "typeorm";

const questionRepository = AppDataSource.getRepository(Question);

const createQuestion = async (data: CreateQuestionInput) => {
  const newQuestion = questionRepository.create(data);
  return questionRepository.save(newQuestion);
};

const getQuestionsByJobId = async (jobPostId: string, orgId: number) => {
  return questionRepository.find({
    where: {
      job_post_id: jobPostId,
      org_id: orgId,
      deleted_at: IsNull(),
    },
    order: { order: "ASC" },
  });
};

const getQuestion = async (filter: { id: number; org_id: number }) => {
  return questionRepository.findOne({
    where: { ...filter, deleted_at: IsNull() },
  });
};

const updateQuestion = async (
  filter: { id: number; org_id: number },
  data: UpdateQuestionInput
) => {
  return questionRepository.update(filter, data);
};

const deleteQuestion = async (
  filter: { id: number; org_id: number },
  deletedBy: number
) => {
  return questionRepository.update(filter, {
    deleted_at: new Date(),
    deleted_by: deletedBy,
  });
};

const deleteQuestionsByJobId = async (
  jobPostId: string,
  orgId: number,
  deletedBy: number
) => {
  return questionRepository.update(
    { job_post_id: jobPostId, org_id: orgId, deleted_at: IsNull() },
    { deleted_at: new Date(), deleted_by: deletedBy }
  );
};

export {
  createQuestion,
  getQuestionsByJobId,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  deleteQuestionsByJobId,
};
