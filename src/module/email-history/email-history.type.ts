export interface CandidateEmailHistoryType {
  id: number;
  org_id: number;
  user_id: number;
  sender_id: number;
  subject: string;
  body: string;
  reply_to: string | null;
  link_name: string | null;
  link_url: string | null;
  created_at: Date;
}

export type CreateCandidateEmailHistoryInput = Omit<
  CandidateEmailHistoryType,
  "id" | "created_at"
>;

export interface SubmissionEmailHistoryType {
  id: number;
  org_id: number;
  submission_id: number;
  sender_id: number;
  subject: string;
  body: string;
  reply_to: string | null;
  link_name: string | null;
  link_url: string | null;
  created_at: Date;
}

export type CreateSubmissionEmailHistoryInput = Omit<
  SubmissionEmailHistoryType,
  "id" | "created_at"
>;
