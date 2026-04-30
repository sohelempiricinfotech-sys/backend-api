import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { Organization } from "../organizations/organization.model";
import { Skill } from "../skills/skill.model";
import { User } from "../users/user.model";

@Entity({ name: "candidate_skills" })
export class CandidateSkill {
  @Column({ type: "int", nullable: false })
  org_id: number;
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @PrimaryColumn({ type: "int" })
  user_id: number;
  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

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
