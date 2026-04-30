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
import { Submission } from "../submissions/submission.model";

@Entity({ name: "submission_email_history" })
export class SubmissionEmailHistory {
  @PrimaryGeneratedColumn("increment")
  id: number;

  // ---------- RELATION FIELDS ----------
  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  // Submission this email relates to
  @Column({ type: "int", nullable: false })
  submission_id: number;
  @ManyToOne(() => Submission, { nullable: false })
  @JoinColumn({ name: "submission_id" })
  submission: Submission;

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
