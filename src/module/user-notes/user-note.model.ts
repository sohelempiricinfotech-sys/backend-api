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
import { User } from "../users/user.model";

export enum NoteType {
  NONE = "none",
  CALL = "call",
}

@Entity({ name: "user_notes" })
export class UserNote {
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

  // ---------- NOTE DETAILS ----------
  @Column({ type: "text", nullable: true })
  note: string | null;

  @Column({type: "text", nullable: false})
  type: string;

  @Column({ type: "enum", enum: NoteType, default: NoteType.NONE })
  note_type: NoteType;

  // ---------- AUDIT TRAIL ----------
  @Column({ type: "int", nullable: true })
  created_by: number | null;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "created_by" })
  created_by_user: User | null;

  @Column({ type: "int", nullable: true })
  updated_by: number | null;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "updated_by" })
  updated_by_user: User | null;

  @Column({ type: "int", nullable: true })
  deleted_by: number | null;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "deleted_by" })
  deleted_by_user: User | null;

  // ---------- TIMESTAMPS ----------
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date | null;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updated_at: Date | null;

  @Column({ type: "timestamp", nullable: true })
  deleted_at: Date | null;
}
