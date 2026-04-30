import { AppDataSource } from "../../data-source";
import { User, SystemRole } from "../users/user.model";
import { getProfilePhotoSignedUrl } from "../../utility/s3";

const userRepo = AppDataSource.getRepository(User);

export const getContactsByClient = async (
    org_id: number,
    client_id: number,
    page: number,
    limit: number,
    search?: string
) => {
    const query = userRepo
        .createQueryBuilder("user")
        .select([
            "user.id",
            "user.org_id",
            "user.client_id",
            "user.first_name",
            "user.last_name",
            "user.email",
            "user.phone",
            "user.status",
            "user.system_role",
            "user.created_at",
            "user.updated_at",
        ])
        .where("user.org_id = :org_id", { org_id })
        .andWhere("user.client_id = :client_id", { client_id })
        .andWhere("user.system_role = :system_role", { system_role: SystemRole.CLIENT_USER })
        .andWhere("user.deleted_at IS NULL");

    if (search) {
        query.andWhere(
            "(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)",
            { search: `%${search}%` }
        );
    }

    query
        .orderBy("user.created_at", "DESC")
        .skip((page - 1) * limit)
        .take(limit);

    const [contacts, total] = await query.getManyAndCount();
    const hasMore = (page - 1) * limit + contacts.length < total;
    const totalPages = Math.ceil(total / limit);

    const contactsWithPhotos = await Promise.all(
        contacts.map(async (contact) => {
            let profile_photo_url: string | null = null;
            try {
                profile_photo_url = await getProfilePhotoSignedUrl(contact.id);
            } catch {
                profile_photo_url = null;
            }
            return { ...contact, profile_photo_url };
        })
    );

    return { contacts: contactsWithPhotos, total, hasMore, totalPages };
};

export const createContact = async (data: Partial<User>) => {
    const contact = userRepo.create({
        ...data,
        system_role: SystemRole.CLIENT_USER,
    });
    return await userRepo.save(contact);
};

export const updateContact = async (
    id: number,
    org_id: number,
    client_id: number,
    data: Partial<User>
) => {
    await userRepo.update(
        { id, org_id, client_id, system_role: SystemRole.CLIENT_USER },
        data
    );
    return await userRepo.findOne({
        where: { id, org_id, client_id, system_role: SystemRole.CLIENT_USER },
        select: [
            "id", "org_id", "client_id", "first_name", "last_name",
            "email", "phone", "status", "system_role", "created_at", "updated_at",
        ],
    });
};

export const deleteContact = async (
    id: number,
    org_id: number,
    client_id: number,
    deleted_by: number
) => {
    return await userRepo.update(
        { id, org_id, client_id, system_role: SystemRole.CLIENT_USER },
        { deleted_at: new Date(), deleted_by }
    );
};
