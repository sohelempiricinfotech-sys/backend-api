import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Organization } from "../organizations/organization.model";
import { User } from "../users/user.model";

@Entity({ name: "candidate_email_history" })
export class CandidateEmailHistory {
  @PrimaryGeneratedColumn("increment")
  id: number;

  // ---------- RELATION FIELDS ----------
  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  // Candidate who received the email
  @Column({ type: "int", nullable: false })
  user_id: number;
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  // Employee who sent the email
  @Column({ type: "int", nullable: false })
  sender_id: number;
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "sender_id" })
  sender: User;

  // ---------- EMAIL DETAILS ----------
  @Column({ type: "varchar", length: 500, nullable: false })
  subject: string;

  @Column({ type: "text", nullable: false })
  body: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  reply_to: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  link_name: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  link_url: string | null;

  // ---------- TIMESTAMPS ----------
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;
}
