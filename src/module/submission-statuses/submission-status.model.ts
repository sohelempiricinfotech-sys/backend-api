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

export enum StatusType {
  LONGLIST = "longlist",
  APPLICATION = "application",
  INTERVIEW = "interview",
  REJECTED = "rejected",
  JOINED = "joined",
  OTHER = "other",
}

@Entity({ name: "submission_statuses" })
export class SubmissionStatus {
  @PrimaryGeneratedColumn("increment")
  id: number;

  // ---------- RELATION FIELDS ----------
  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @Column({ type: "uuid", nullable: false })
  job_id: string;
  @ManyToOne(() => JobPost, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "job_id" })
  job: JobPost;

  // ---------- STATUS DETAILS ----------
  @Column({ type: "varchar", length: 255, nullable: false })
  name: string;

  @Column({ type: "int", nullable: true })
  order: number | null;

  @Column({ type: "boolean", default: false })
  is_default: boolean;

  @Column({ type: "enum", enum: StatusType, default: StatusType.OTHER })
  status_type: StatusType;

  @Column({ type: "int", default: 0 })
  count: number;

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
