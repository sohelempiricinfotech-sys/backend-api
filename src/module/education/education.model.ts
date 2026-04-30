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

@Entity({ name: "education" })
export class Education {
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

  // ---------- EDUCATION DETAILS ----------
  @Column({ type: "varchar", length: 255, nullable: true })
  degree: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  institution: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  field_of_study: string | null;

  @Column({ type: "date", nullable: true })
  start_date: Date | null;

  @Column({ type: "date", nullable: true })
  end_date: Date | null;

  @Column({ type: "float", nullable: true })
  gpa: number | null;

  // ---------- FILE DETAILS ----------
  @Column({ type: "varchar", length: 500, nullable: true })
  transcript_file: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  certificate_file: string | null;

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
