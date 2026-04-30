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

@Entity("org_permissions")
export class OrgPermission {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @Column({ type: "varchar", length: 255 })
  permission_name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "simple-json" })
  modules: Record<string, any>;

  @Column({ type: "simple-json", nullable: true })
  limits: Record<string, number>;

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
