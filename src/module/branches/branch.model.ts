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

@Entity({ name: "branches" })
export class Branch {
    @PrimaryGeneratedColumn("increment")
    id: number;

    // ---------- RELATION FIELDS ----------
    @Column({ type: "int", nullable: false })
    org_id: number;
    @ManyToOne(() => Organization, { nullable: false })
    @JoinColumn({ name: "org_id" })
    organization: Organization;

    @Column({ type: "int", nullable: false })
    client_id: number;
    @ManyToOne(() => Client, { nullable: false })
    @JoinColumn({ name: "client_id" })
    client: Client;

    // ---------- BRANCH DETAILS ----------
    @Column({ type: "varchar", length: 255, nullable: false })
    branch_name: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    branch_code: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    address_line_1: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    address_line_2: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    city: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    state: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    country: string | null;

    @Column({ type: "varchar", length: 20, nullable: true })
    pincode: string | null;

    @Column({ type: "varchar", length: 20, nullable: true })
    phone: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    email: string | null;

    @Column({ type: "varchar", length: 50, default: "Active" })
    status: string;

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
