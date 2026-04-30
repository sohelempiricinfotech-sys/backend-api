export interface BranchType {
    id: number;
    org_id: number;
    client_id: number;
    branch_name: string;
    branch_code: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
    phone: string | null;
    email: string | null;
    status: string;
    created_by: number | null;
    updated_by: number | null;
    deleted_by: number | null;
    created_at: Date | null;
    updated_at: Date | null;
    deleted_at: Date | null;
}
