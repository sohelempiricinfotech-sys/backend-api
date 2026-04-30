import { Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import * as contactService from "./client-contact.services";
import { uploadFileToS3, getProfilePhotoKey, getProfilePhotoSignedUrl } from "../../utility/s3";
import { AppDataSource } from "../../data-source";
import { User, SystemRole } from "../users/user.model";

const userRepo = AppDataSource.getRepository(User);

export const contactPhotoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
        }
    },
});

export const getContacts = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const client_id = Number(req.params.clientId);
        const { page = 1, limit = 10, search } = req.query;

        const result = await contactService.getContactsByClient(
            org_id,
            client_id,
            Number(page),
            Number(limit),
            search as string
        );

        return res.status(200).json({ message: "Contacts fetched successfully", data: result });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const createContact = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const client_id = Number(req.params.clientId);

        const contactData = {
            ...req.body,
            org_id,
            client_id,
            created_by: user_id,
        };

        const contact = await contactService.createContact(contactData);

        const { password, access_token, refresh_token, ...safeContact } = contact as any;
        return res.status(201).json({ message: "Contact created successfully", data: safeContact });
    } catch (error: any) {
        console.error(error);
        if (error.code === "23505") {
            return res.status(400).json({ error: "A user with this email already exists" });
        }
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const updateContact = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const client_id = Number(req.params.clientId);
        const { id } = req.params;

        const validatedData = {
            ...req.body,
            updated_by: user_id,
        };

        const contact = await contactService.updateContact(
            Number(id),
            org_id,
            client_id,
            validatedData
        );

        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }

        return res.status(200).json({ message: "Contact updated successfully", data: contact });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const deleteContact = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const client_id = Number(req.params.clientId);
        const { id } = req.params;

        await contactService.deleteContact(Number(id), org_id, client_id, user_id);

        return res.status(200).json({ message: "Contact deleted successfully" });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const uploadContactPhoto = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const client_id = Number(req.params.clientId);
        const contactId = Number(req.params.id);

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const user = await userRepo.findOneBy({
            id: contactId,
            org_id,
            client_id,
            system_role: SystemRole.CLIENT_USER,
        });

        if (!user) {
            return res.status(404).json({ error: "Contact not found" });
        }

        const webpBuffer = await sharp(req.file.buffer)
            .webp({ quality: 80 })
            .toBuffer();

        const s3Key = getProfilePhotoKey(contactId);
        await uploadFileToS3(webpBuffer, s3Key, "image/webp");

        const profile_photo_url = await getProfilePhotoSignedUrl(contactId);

        return res.status(200).json({
            message: "Photo uploaded successfully",
            data: { profile_photo_url },
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};
