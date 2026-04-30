import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  JoinColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { Organization } from "../organizations/organization.model";
import { Skill } from "../skills/skill.model";
import { JobPost } from "../job/job.model";

@Entity({ name: "job_skills" })
export class JobPostSkill {
  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @PrimaryColumn({ type: "uuid" })
  job_post_id: string;
  @ManyToOne(() => JobPost)
  @JoinColumn({ name: "job_post_id" })
  jobPost: JobPost;

  @PrimaryColumn({ type: "int" })
  @Index()
  skill_id: number;
  @ManyToOne(() => Skill)
  @JoinColumn({ name: "skill_id" })
  skill: Skill;

  // ---------- TIMESTAMPS ----------
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date | null;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updated_at: Date | null;
}
