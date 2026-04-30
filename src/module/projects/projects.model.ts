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
import { Client } from "../clients/client.model";

@Entity({ name: "projects" })
export class Project {
    @PrimaryGeneratedColumn("increment")
    id: number;

    // ---------- RELATION FIELDS ----------
    @Column({ type: "int", nullable: false })
    org_id: number;
    @ManyToOne(() => Organization, { nullable: false })
    @JoinColumn({ name: "org_id" })
    organization: Organization;

    @Column({ type: "int", nullable: true })
    client_id: number | null;
    @ManyToOne(() => Client, { nullable: true })
    @JoinColumn({ name: "client_id" })
    client: Client | null;

    // ---------- PROJECT DETAILS ----------
    @Column({ type: "varchar", length: 255, nullable: false })
    name: string;

    @Column({ type: "int", array: true, nullable: true })
    assignee_ids: number[] | null;

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
