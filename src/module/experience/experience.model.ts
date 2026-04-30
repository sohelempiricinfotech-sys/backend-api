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

@Entity({ name: "experience" })
export class Experience {
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

  // ---------- EXPERIENCE DETAILS ----------
  @Column({ type: "varchar", length: 255, nullable: true })
  job_title: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  company_name: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  location: string | null;

  @Column({ type: "date", nullable: true })
  start_date: Date | null;

  @Column({ type: "date", nullable: true })
  end_date: Date | null;

  @Column({ type: "boolean", default: false })
  is_present: boolean;

  @Column({ type: "text", nullable: true })
  description: string | null;

  // ---------- FILE DETAILS ----------
  @Column({ type: "varchar", length: 500, nullable: true })
  experience_letter_file: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  salary_slip_file: string | null;

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
