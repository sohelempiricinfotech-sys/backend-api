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

@Entity({ name: "smtp_settings" })
export class SmtpSettings {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "int", nullable: false, unique: true })
  org_id: number;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  // ---------- SMTP CONFIG ----------
  @Column({ type: "varchar", length: 255, nullable: false })
  host: string;

  @Column({ type: "int", nullable: false, default: 587 })
  port: number;

  @Column({ type: "boolean", default: false })
  secure: boolean;

  @Column({ type: "varchar", length: 255, nullable: false })
  username: string;

  @Column({ type: "varchar", length: 500, nullable: false })
  password: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  from_email: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  from_name: string | null;

  // ---------- AUDIT TRAIL ----------
  @Column({ type: "int", nullable: true })
  created_by: number | null;

  @Column({ type: "int", nullable: true })
  updated_by: number | null;

  // ---------- TIMESTAMPS ----------
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date | null;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updated_at: Date | null;
}
