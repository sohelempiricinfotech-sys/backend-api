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
import { SubmissionStatus } from "../submission-statuses/submission-status.model";
import { User } from "../users/user.model";
import { JobPost } from "../job/job.model";
import { Resume } from "../resumes/resume.model";
import { Source } from "../sources/source.model";

@Entity({ name: "submissions" })
export class Submission {
  @PrimaryGeneratedColumn("increment")
  id: number;

  // ---------- RELATION FIELDS ----------
  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @Column({ type: "int", nullable: true })
  user_id: number | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user: User | null;

  @Column({ type: "uuid", nullable: true })
  job_id: string | null;
  @ManyToOne(() => JobPost, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "job_id" })
  job: JobPost | null;

  @Column({ type: "int", nullable: true })
  submission_status_id: number | null;
  @ManyToOne(() => SubmissionStatus, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "submission_status_id" })
  submissionStatus: SubmissionStatus | null;

  @Column({ type: "int", nullable: true })
  recruiter_user_id: number | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "recruiter_user_id" })
  recruiterUser: User | null;

  @Column({ type: "int", nullable: true })
  source_id: number | null;
  @ManyToOne(() => Source, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "source_id" })
  source: Source | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  unique_submission_id: string | null;

  @Column({ type: "json", nullable: true })
  questions_answers: Record<string, any> | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  expected_ctc: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  offer_ctc: string | null;

  @Column({ type: "int", nullable: true })
  notice_period: number | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  availability: string | null;

  @Column({ type: "int", nullable: true })
  resume_id: number | null;
  @ManyToOne(() => Resume, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "resume_id" })
  resume: Resume | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  resume_path: string | null;

  // ---------- EMAIL TRACKING ----------
  @Column({ type: "int", default: 0, nullable: false })
  email_send_count: number;

  // ---------- READ STATUS ----------
  @Column({ type: "boolean", default: true, nullable: false })
  unread: boolean;

  // ---------- SUBMISSION DATE ----------
  @Column({ type: "varchar", length: 255, nullable: true })
  submission_date_at: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  updated_date: string | null;

  // ---------- AUDIT TRAIL ----------
  @Column({ type: "int", nullable: true })
  created_by: number | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by" })
  createdByUser: User | null;

  @Column({ type: "int", nullable: true })
  updated_by: number | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "updated_by" })
  updatedByAuditUser: User | null;

  @Column({ type: "int", nullable: true })
  deleted_by: number | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "deleted_by" })
  deletedByUser: User | null;

  // ---------- TIMESTAMPS ----------
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date | null;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updated_at: Date | null;

  @Column({ type: "timestamp", nullable: true })
  deleted_at: Date | null;
}
