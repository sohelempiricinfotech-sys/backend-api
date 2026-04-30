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
import { Project } from "../projects/projects.model";
import { Branch } from "../branches/branch.model";
import { User } from "../users/user.model";
import { JobStatus } from "./job.type";

@Entity({ name: "job_posts" })
export class JobPost {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // ---------- RELATION FIELDS ----------
  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @Column({ type: "int", nullable: true })
  team_leader_id: number | null;

  @Column({ type: "int", nullable: true })
  owner_user_id: number | null;

  @Column({ type: "int", nullable: true })
  industry_id: number | null;

  @Column({ type: "int", nullable: true })
  project_id: number | null;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: "project_id" })
  project: Project | null;

  @Column({ type: "int", nullable: true })
  branch_id: number | null;
  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: "branch_id" })
  branch: Branch | null;

  @Column({ type: "int", nullable: true })
  contact_person_id: number | null;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "contact_person_id" })
  contactPerson: User | null;

  @Column({ type: "int", array: true, nullable: true })
  assignee_ids: number[] | null;

  @Column({ type: "int", nullable: true })
  interviewer_id: number | null;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "interviewer_id" })
  interviewer: User | null;

  // ---------- JOB DETAILS ----------
  @Column({ type: "varchar", length: 255, nullable: true })
  job_title: string | null;

  @Column({ type: "text", nullable: true })
  job_description: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  unique_job_id: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  experience: string | null;

  @Column({ type: "text", nullable: true })
  question: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  number_of_positions: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  customer: string | null;

  @Column({ type: "date", nullable: true })
  target_date: Date | null;

  @Column({ type: "text", nullable: true })
  description: string | null;

  // ---------- LOCATION DETAILS ----------
  @Column({ type: "varchar", length: 255, nullable: true })
  job_address: string | null;

  @Column({ type: "int", nullable: true })
  pincode: number | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  city: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  state: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  country: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  remote_status: string | null;

  // ---------- JOB TYPE & PLACEMENT DETAILS ----------
  @Column({ type: "varchar", length: 100, nullable: true })
  job_type: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  placement_type: string | null;

  @Column({ type: "float", nullable: true })
  min_ctc: number | null;

  @Column({ type: "float", nullable: true })
  max_ctc: number | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  onetime_placement_bill_type: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  onetime_placement_bill_value: string | null;

  // ---------- STATUS & VERIFICATION ----------
  @Column({ type: "boolean", default: true, nullable: true })
  is_verified: boolean | null;

  @Column({ type: "enum", enum: JobStatus, default: JobStatus.ACTIVE, nullable: true })
  status: JobStatus | null;

  @Column({ type: "boolean", default: true })
  published: boolean;

  // ---------- CONTACT DETAILS ----------
  @Column({ type: "varchar", length: 20, nullable: true })
  owner_phone: string | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  country_code: string | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  state_code: string | null;

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
