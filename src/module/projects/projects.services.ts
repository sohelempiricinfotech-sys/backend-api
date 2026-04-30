import { AppDataSource } from "../../data-source";
import { Project } from "./projects.model";
import { IsNull } from "typeorm";

const projectRepo = AppDataSource.getRepository(Project);

export const createProject = async (data: Partial<Project>) => {
    const project = projectRepo.create(data);
    return await projectRepo.save(project);
};

export const getProjects = async (
    org_id: number,
    page: number,
    limit: number,
    search?: string,
    client_id?: number
) => {
    const query = projectRepo
        .createQueryBuilder("project")
        .where("project.org_id = :org_id", { org_id })
        .andWhere("project.deleted_at IS NULL");

    if (client_id) {
        query.andWhere("project.client_id = :client_id", { client_id });
    }

    if (search) {
        query.andWhere("project.name ILIKE :search", { search: `%${search}%` });
    }

    query
        .orderBy("project.created_at", "DESC")
        .skip((page - 1) * limit)
        .take(limit);

    const [projects, total] = await query.getManyAndCount();
    const hasMore = (page - 1) * limit + projects.length < total;
    const totalPages = Math.ceil(total / limit);
    return { projects, total, hasMore, totalPages };
};

export const getProjectById = async (id: number, org_id: number) => {
    return await projectRepo.findOne({
        where: { id, org_id, deleted_at: IsNull() },
    });
};

export const updateProject = async (
    id: number,
    org_id: number,
    data: Partial<Project>
) => {
    await projectRepo.update({ id, org_id }, data);
    return await getProjectById(id, org_id);
};

export const deleteProject = async (
    id: number,
    org_id: number,
    deleted_by: number
) => {
    return await projectRepo.update(
        { id, org_id },
        { deleted_at: new Date(), deleted_by }
    );
};
