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

@Entity({ name: "user_metadata" })
export class UserMetadata {
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

  // ---------- PERSONAL DETAILS ----------
  @Column({ type: "varchar", length: 50, nullable: true })
  gender: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  date_of_birth: string | null;

  // ---------- ADDRESS ----------
  @Column({ type: "varchar", length: 255, nullable: true })
  address_line_1: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  address_line_2: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  city: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  state: string | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  pincode: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  country: string | null;

  // ---------- GOVERNMENT IDS ----------
  @Column({ type: "varchar", length: 50, nullable: true })
  aadhar_card_number: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  pan_card_number: string | null;

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
