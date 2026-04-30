import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "organizations" })
export class Organization {
  @PrimaryGeneratedColumn("increment")
  id: number;

  // ---------- BASIC ORGANIZATION INFO ----------
  @Column({ type: "varchar", length: 255, unique: true, nullable: false })
  name: string;

  @Column({ type: "varchar", length: 100, unique: true, nullable: false })
  slug: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  tagline: string | null;

  @Column({ type: "text", nullable: true })
  address: string | null;

  @Column({ type: "boolean", default: false })
  has_logo: boolean;

  // ---------- SOCIAL HANDLES ----------
  @Column({ type: "varchar", length: 500, nullable: true })
  social_x: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  social_facebook: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  social_instagram: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  social_linkedin: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  social_youtube: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  social_whatsapp: string | null;

  // ---------- RELATION FIELDS ----------
  @Column({ type: "int", nullable: true })
  plan_id: number | null;

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
