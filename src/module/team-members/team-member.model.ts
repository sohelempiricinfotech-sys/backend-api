import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Organization } from "../organizations/organization.model";

@Entity("team_members")
export class TeamMember {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @Column({ type: "uuid" })
  team_id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "uuid", nullable: true })
  reporting_user_id: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  designation: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  created_by: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  updated_by: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  deleted_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: "timestamp", nullable: true })
  deleted_at: Date;
}
