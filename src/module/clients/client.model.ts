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
import { Industry } from "../industries/industry.model";

@Entity({ name: "clients" })
export class Client {
    @PrimaryGeneratedColumn("increment")
    id: number;

    // ---------- RELATION FIELDS ----------
    @Column({ type: "int", nullable: false })
    org_id: number;
    @ManyToOne(() => Organization, { nullable: false })
    @JoinColumn({ name: "org_id" })
    organization: Organization;

    // ---------- CLIENT DETAILS ----------
    @Column({ type: "varchar", length: 255, nullable: false })
    client_name: string;

    @Column({ type: "varchar", length: 20, nullable: true })
    phone: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    email: string | null;

    @Column({ type: "varchar", length: 500, nullable: true })
    website: string | null;

    @Column({ type: "varchar", length: 50, default: "Active" })
    status: string;

    @Column({ type: "text", nullable: true })
    description: string | null;

    @Column({ type: "int", nullable: true })
    industry_id: number | null;
    @ManyToOne(() => Industry, { nullable: true })
    @JoinColumn({ name: "industry_id" })
    industry: Industry | null;

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
