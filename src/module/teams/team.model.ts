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

@Entity("teams")
export class Team {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @Column({ type: "varchar", length: 255 })
  team_name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  team_head_id: string;

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
