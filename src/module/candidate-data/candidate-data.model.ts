import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Organization } from "../organizations/organization.model";

@Entity({ name: "candidate_data" })
export class CandidateData {
  @PrimaryGeneratedColumn("increment")
  id: number;

  // ---------- RELATION FIELDS ----------
  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @Column({ type: "int", nullable: false })
  user_id: number;

  @Column({ type: "int", nullable: true })
  status: number | null;

  @Column({ type: "int", nullable: true })
  owner_user_id: number | null;

  @Column({ type: "int", nullable: true })
  industry_id: number | null;

  // ---------- EXPERIENCE & DESIGNATION ----------
  @Column({ type: "float", nullable: true })
  experience_years: number | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  designation: string | null;

  @Column({ type: "json", nullable: true })
  reference: Record<string, any> | null;

  // ---------- COMMUNICATION & DETAILS ----------
  @Column({ type: "boolean", default: false, nullable: true })
  send_mail: boolean | null;

  @Column({ type: "text", nullable: true })
  short_summary: string | null;

  @Column({ type: "int", nullable: true })
  notice_period: number | null;

  @Column({ type: "text", nullable: true })
  resume_content: string | null;

  @Column({ type: "text", array: true, nullable: true })
  objectives: string[] | null;

  // ---------- OTHER DETAILS ----------
  @Column({ type: "varchar", length: 500, nullable: true })
  linkedin_url: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  select_field: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  candidate_reference: string | null;

  // ---------- JOINED STATUS ----------
  @Column({ type: "boolean", default: false, nullable: true })
  joined: boolean | null;

  // ---------- EMAIL TRACKING ----------
  @Column({ type: "int", default: 0, nullable: false })
  email_send_count: number;

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
