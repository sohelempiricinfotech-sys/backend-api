import { SubmissionStatus, StatusType } from "./submission-status.model";
import { AppDataSource } from "../../data-source";
import { CreateSubmissionStatusInput, UpdateSubmissionStatusInput } from "./submission-status.type";
import { IsNull } from "typeorm";

const submissionStatusRepository = AppDataSource.getRepository(SubmissionStatus);

const createSubmissionStatus = async (data: CreateSubmissionStatusInput) => {
  const newSubmissionStatus = submissionStatusRepository.create(data);
  return submissionStatusRepository.save(newSubmissionStatus);
};

const getSubmissionStatusesByJobId = async (jobId: string, orgId: number) => {
  return submissionStatusRepository.find({
    where: { job_id: jobId, org_id: orgId, deleted_at: IsNull() },
    order: { order: "ASC", id: "ASC" },
  });
};

const getSubmissionStatus = async (filter: object) => {
  return submissionStatusRepository.findOneBy(filter);
};

const updateSubmissionStatus = async (
  filter: object,
  data: SubmissionStatus,
  submissionStatusData: UpdateSubmissionStatusInput
) => {
  const newData = submissionStatusRepository.merge(data, submissionStatusData);
  return submissionStatusRepository.save(newData);
};

const hardDeleteSubmissionStatus = async (id: number, orgId: number) => {
  return submissionStatusRepository.delete({ id, org_id: orgId });
};

const createMultipleSubmissionStatuses = async (dataArray: CreateSubmissionStatusInput[]) => {
  const entities = submissionStatusRepository.create(dataArray);
  return submissionStatusRepository.save(entities);
};

const getDefaultStatusByJobId = async (jobId: string, orgId: number) => {
  return submissionStatusRepository.findOneBy({
    job_id: jobId,
    org_id: orgId,
    is_default: true,
    deleted_at: IsNull(),
  });
};

const getPipelineStatusByJobId = async (jobId: string, orgId: number) => {
  return submissionStatusRepository.findOneBy({
    job_id: jobId,
    org_id: orgId,
    status_type: StatusType.LONGLIST,
    deleted_at: IsNull(),
  });
};

const getApplicationStatusByJobId = async (jobId: string, orgId: number) => {
  return submissionStatusRepository.findOneBy({
    job_id: jobId,
    org_id: orgId,
    status_type: StatusType.APPLICATION,
    deleted_at: IsNull(),
  });
};

const adjustStatusCounts = async (
  countMap: Record<number, number>,
  orgId: number
): Promise<void> => {
  for (const [statusIdStr, delta] of Object.entries(countMap)) {
    if (delta === 0) continue;
    await submissionStatusRepository
      .createQueryBuilder()
      .update(SubmissionStatus)
      .set({ count: () => `GREATEST(count + ${delta}, 0)` })
      .where("id = :statusId AND org_id = :orgId", {
        statusId: Number(statusIdStr),
        orgId,
      })
      .execute();
  }
};

export {
  createSubmissionStatus,
  getSubmissionStatusesByJobId,
  getSubmissionStatus,
  updateSubmissionStatus,
  hardDeleteSubmissionStatus,
  createMultipleSubmissionStatuses,
  getDefaultStatusByJobId,
  getPipelineStatusByJobId,
  getApplicationStatusByJobId,
  adjustStatusCounts,
};
