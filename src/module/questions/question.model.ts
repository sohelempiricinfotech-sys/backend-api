import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Organization } from "../organizations/organization.model";
import { JobPost } from "../job/job.model";

export enum QuestionType {
  TEXT = "text",
  TEXTAREA = "textarea",
  RADIO = "radio",
  CHECKBOX = "checkbox",
  DROPDOWN = "dropdown",
  FILE = "file",
}

@Entity({ name: "questions" })
export class Question {
  @PrimaryGeneratedColumn("increment")
  id: number;

  // ---------- RELATION FIELDS ----------
  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @Column({ type: "uuid", nullable: false })
  job_post_id: string;
  @ManyToOne(() => JobPost, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "job_post_id" })
  jobPost: JobPost;

  // ---------- QUESTION DETAILS ----------
  @Column({ type: "varchar", length: 500, nullable: false })
  question_text: string;

  @Column({ type: "varchar", length: 1000, nullable: true })
  description: string | null;

  @Column({
    type: "enum",
    enum: QuestionType,
    default: QuestionType.TEXT,
  })
  question_type: QuestionType;

  @Column({ type: "jsonb", nullable: true })
  options: string[] | null;

  @Column({ type: "boolean", default: false })
  is_required: boolean;

  @Column({ type: "int", default: 0 })
  order: number;

  // ---------- AUDIT TRAIL ----------
  @Column({ type: "int", nullable: true })
  created_by: number | null;

  @Column({ type: "int", nullable: true })
  updated_by: number | null;

  @Column({ type: "int", nullable: true })
  deleted_by: number | null;

  // ---------- TIMESTAMPS ----------
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date | null;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updated_at: Date | null;

  @Column({ type: "timestamp", nullable: true })
  deleted_at: Date | null;
}
