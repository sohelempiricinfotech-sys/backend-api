import { QuestionType } from "./question.model";

export interface QuestionTypeInterface {
  id: number;
  org_id: number;
  job_post_id: string;
  question_text: string;
  description: string | null;
  question_type: QuestionType;
  options: string[] | null;
  is_required: boolean;
  order: number;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
}

export type CreateQuestionInput = Omit<
  QuestionTypeInterface,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export type UpdateQuestionInput = Partial<
  Omit<QuestionTypeInterface, "id" | "created_at" | "updated_at">
>;

// Input type for questions coming from frontend (create/update job)
export interface QuestionInput {
  id?: number;
  question_text: string;
  description?: string;
  question_type: QuestionType;
  options?: string[];
  is_required?: boolean;
  order?: number;
  isDeleted?: boolean;
}
