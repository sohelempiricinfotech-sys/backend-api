import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  Index,
  BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Organization } from "../organizations/organization.model";
import { Client } from "../clients/client.model";

export enum SystemRole {
  SUPER_ADMIN = "super_admin",
  ORG_ADMIN = "org_admin",
  EMPLOYEE = "employee",
  CANDIDATE = "candidate",
  MAINTAINER = "maintainer",
  CLIENT_USER = "client_user",
}

@Entity({ name: "users" })
@Index(["org_id", "email", "system_role"], { unique: true })
export class User {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "uuid", nullable: true, unique: true })
  uuid_id: string | null;

  @Column({ type: "int", nullable: false })
  org_id: number;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @Column({ type: "int", nullable: true })
  role_id: number | null;

  @Column({ type: "int", nullable: true })
  client_id: number | null;
  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: "client_id" })
  client: Client | null;

  // ---------- BASIC USER INFO ----------
  @Column({ type: "varchar", length: 255, nullable: true })
  unique_id: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  first_name: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  last_name: string | null;

  @Column({ type: "varchar", length: 255, nullable: false })
  email: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  password: string;

  @Column({ type: "varchar", length: 12, nullable: true })
  oneTimeVerificationCode: string | null;

  @Column({ type: "boolean", default: true, nullable: true })
  is_password: boolean | null;

  @Column({ type: "boolean", default: true, nullable: true })
  is_verified: boolean | null;

  @Column({ type: "varchar", length: 50, default: "Active", nullable: true })
  status: string | null;

  @Column({
    type: "enum",
    enum: SystemRole,
    default: SystemRole.CANDIDATE,
    nullable: true,
  })
  system_role: SystemRole;

  @Column({ type: "varchar", length: 500, nullable: true })
  profile_photo: string | null;

  @Column({ type: "json", nullable: true })
  user_detail: Record<string, any> | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  access_token: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  refresh_token: string | null;

  @Column({ type: "int", nullable: true })
  two_factor_otp: number | null;

  @Column({ type: "timestamp", nullable: true })
  otp_expires_at: Date | null;

  // ---------- LOGIN & ACTIVITY TRACKING ----------
  @Column({ type: "timestamp", nullable: true })
  last_activity: Date | null;

  @Column({ type: "int", default: 0, nullable: true })
  login_attempts: number | null;

  @Column({ type: "timestamp", nullable: true })
  login_attempts_at: Date | null;

  @Column({ type: "int", default: 0, nullable: true })
  resume_views_by_user: number | null;

  @Column({ type: "timestamp", nullable: true })
  resume_view_reset_time: Date | null;

  @Column({ type: "int", default: 0, nullable: true })
  file_download_count: number | null;

  @Column({ type: "timestamp", nullable: true })
  file_download_reset_time: Date | null;

  // ---------- ONBOARDING ----------
  @Column({ type: "boolean", default: false, nullable: true })
  onboard: boolean | null;

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

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid_id) {
      this.uuid_id = uuidv4();
    }
  }
}
