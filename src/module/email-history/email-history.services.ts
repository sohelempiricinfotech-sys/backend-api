import { AppDataSource } from "../../data-source";
import { CandidateEmailHistory } from "./candidate-email-history.model";
import { SubmissionEmailHistory } from "./submission-email-history.model";
import {
  CreateCandidateEmailHistoryInput,
  CreateSubmissionEmailHistoryInput,
} from "./email-history.type";

const candidateEmailHistoryRepo =
  AppDataSource.getRepository(CandidateEmailHistory);
const submissionEmailHistoryRepo =
  AppDataSource.getRepository(SubmissionEmailHistory);

// ---------- CANDIDATE EMAIL HISTORY ----------

export const bulkCreateCandidateEmailHistory = async (
  records: CreateCandidateEmailHistoryInput[]
): Promise<void> => {
  if (records.length === 0) return;
  await candidateEmailHistoryRepo
    .createQueryBuilder()
    .insert()
    .into(CandidateEmailHistory)
    .values(records)
    .execute();
};

export const getCandidateEmailHistory = async (
  userId: number,
  orgId: number
) => {
  return candidateEmailHistoryRepo
    .createQueryBuilder("eh")
    .leftJoin(
      "users",
      "sender",
      "sender.id = eh.sender_id AND sender.org_id = eh.org_id"
    )
    .select([
      "eh.id AS id",
      "eh.user_id AS user_id",
      "eh.sender_id AS sender_id",
      "eh.subject AS subject",
      "eh.body AS body",
      "eh.reply_to AS reply_to",
      "eh.link_name AS link_name",
      "eh.link_url AS link_url",
      "eh.created_at AS created_at",
      "sender.first_name AS sender_first_name",
      "sender.last_name AS sender_last_name",
      "sender.email AS sender_email",
    ])
    .where("eh.user_id = :userId", { userId })
    .andWhere("eh.org_id = :orgId", { orgId })
    .orderBy("eh.created_at", "DESC")
    .getRawMany();
};

// ---------- SUBMISSION EMAIL HISTORY ----------

export const bulkCreateSubmissionEmailHistory = async (
  records: CreateSubmissionEmailHistoryInput[]
): Promise<void> => {
  if (records.length === 0) return;
  await submissionEmailHistoryRepo
    .createQueryBuilder()
    .insert()
    .into(SubmissionEmailHistory)
    .values(records)
    .execute();
};

export const getSubmissionEmailHistory = async (
  submissionId: number,
  orgId: number
) => {
  return submissionEmailHistoryRepo
    .createQueryBuilder("eh")
    .leftJoin(
      "users",
      "sender",
      "sender.id = eh.sender_id AND sender.org_id = eh.org_id"
    )
    .select([
      "eh.id AS id",
      "eh.submission_id AS submission_id",
      "eh.sender_id AS sender_id",
      "eh.subject AS subject",
      "eh.body AS body",
      "eh.reply_to AS reply_to",
      "eh.link_name AS link_name",
      "eh.link_url AS link_url",
      "eh.created_at AS created_at",
      "sender.first_name AS sender_first_name",
      "sender.last_name AS sender_last_name",
      "sender.email AS sender_email",
    ])
    .where("eh.submission_id = :submissionId", { submissionId })
    .andWhere("eh.org_id = :orgId", { orgId })
    .orderBy("eh.created_at", "DESC")
    .getRawMany();
};
