import { AppDataSource } from "../../data-source";
import { Branch } from "./branch.model";
import { IsNull } from "typeorm";

const branchRepo = AppDataSource.getRepository(Branch);

export const createBranch = async (data: Partial<Branch>) => {
    const branch = branchRepo.create(data);
    return await branchRepo.save(branch);
};

export const getBranches = async (
    org_id: number,
    client_id: number,
    page: number,
    limit: number,
    search?: string
) => {
    const query = branchRepo
        .createQueryBuilder("branch")
        .where("branch.org_id = :org_id", { org_id })
        .andWhere("branch.client_id = :client_id", { client_id })
        .andWhere("branch.deleted_at IS NULL");

    if (search) {
        query.andWhere(
            "(branch.branch_name ILIKE :search OR branch.city ILIKE :search OR branch.email ILIKE :search)",
            { search: `%${search}%` }
        );
    }

    query
        .orderBy("branch.created_at", "DESC")
        .skip((page - 1) * limit)
        .take(limit);

    const [branches, total] = await query.getManyAndCount();
    const hasMore = (page - 1) * limit + branches.length < total;
    const totalPages = Math.ceil(total / limit);
    return { branches, total, hasMore, totalPages };
};

export const getBranchById = async (id: number, org_id: number, client_id: number) => {
    return await branchRepo.findOne({
        where: { id, org_id, client_id, deleted_at: IsNull() },
    });
};

export const updateBranch = async (
    id: number,
    org_id: number,
    client_id: number,
    data: Partial<Branch>
) => {
    await branchRepo.update({ id, org_id, client_id }, data);
    return await getBranchById(id, org_id, client_id);
};

export const getBranchByIdAndOrg = async (id: number, org_id: number) => {
    return await branchRepo.findOne({
        where: { id, org_id, deleted_at: IsNull() },
    });
};

export const deleteBranch = async (
    id: number,
    org_id: number,
    client_id: number,
    deleted_by: number
) => {
    return await branchRepo.update(
        { id, org_id, client_id },
        { deleted_at: new Date(), deleted_by }
    );
};
