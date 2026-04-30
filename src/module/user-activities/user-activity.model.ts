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

@Entity({ name: "user_activities" })
export class UserActivity {
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

  // ---------- ACTIVITY DETAILS ----------
  @Column({ type: "varchar", length: 255, nullable: true })
  component: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  activity: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  user_role: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  activity_on: string | null;

  @Column({ type: "json", nullable: true })
  re_data: Record<string, any> | null;

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
