import { AppDataSource } from "../../data-source";
import { Client } from "./client.model";
import { IsNull } from "typeorm";

const clientRepo = AppDataSource.getRepository(Client);

export const createClient = async (data: Partial<Client>) => {
    const client = clientRepo.create(data);
    return await clientRepo.save(client);
};

export const getClients = async (
    org_id: number,
    page: number,
    limit: number,
    search?: string
) => {
    const query = clientRepo
        .createQueryBuilder("client")
        .where("client.org_id = :org_id", { org_id })
        .andWhere("client.deleted_at IS NULL");

    if (search) {
        query.andWhere(
            "(client.client_name ILIKE :search OR client.email ILIKE :search OR client.phone ILIKE :search)",
            { search: `%${search}%` }
        );
    }

    query
        .orderBy("client.created_at", "DESC")
        .skip((page - 1) * limit)
        .take(limit);

    const [clients, total] = await query.getManyAndCount();
    const hasMore = (page - 1) * limit + clients.length < total;
    const totalPages = Math.ceil(total / limit);
    return { clients, total, hasMore, totalPages };
};

export const getClientById = async (id: number, org_id: number) => {
    return await clientRepo.findOne({
        where: { id, org_id, deleted_at: IsNull() },
    });
};

export const updateClient = async (
    id: number,
    org_id: number,
    data: Partial<Client>
) => {
    await clientRepo.update({ id, org_id }, data);
    return await getClientById(id, org_id);
};

export const deleteClient = async (
    id: number,
    org_id: number,
    deleted_by: number
) => {
    return await clientRepo.update(
        { id, org_id },
        { deleted_at: new Date(), deleted_by }
    );
};
