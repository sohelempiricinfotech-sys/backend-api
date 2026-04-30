export interface ClientType {
    id: number;
    org_id: number;
    client_name: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    status: string;
    description: string | null;
    industry_id: number | null;
    created_by: number | null;
    updated_by: number | null;
    deleted_by: number | null;
    created_at: Date | null;
    updated_at: Date | null;
    deleted_at: Date | null;
}

export type CreateClientInput = Omit<ClientType, "id" | "created_at" | "updated_at" | "deleted_at" | "deleted_by" | "updated_by">;
export type UpdateClientInput = Partial<Omit<ClientType, "id" | "org_id" | "created_at" | "updated_at" | "deleted_at" | "created_by" | "deleted_by">>;
