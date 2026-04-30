import { Request, Response } from "express";
import * as messageTemplateService from "./message-template.services";
import { CreateMessageTemplateInput, UpdateMessageTemplateInput } from "./message-template.type";

export const createMessageTemplate = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { name, subject, body, link_name, link_url } = req.body;

        const input: CreateMessageTemplateInput = {
            org_id,
            user_id,
            name,
            type: "email",
            subject: subject || null,
            body,
            link_name: link_name || null,
            link_url: link_url || null,
            created_by: user_id,
            updated_by: null,
            deleted_by: null,
        };

        const result = await messageTemplateService.createMessageTemplate(input);
        res.status(201).json(result);
    } catch (error: any) {
        console.error("Error creating message template:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessageTemplates = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const templates = await messageTemplateService.getMessageTemplates({ org_id, user_id });
        res.status(200).json(templates);
    } catch (error: any) {
        console.error("Error fetching message templates:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessageTemplate = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;
        const template = await messageTemplateService.getMessageTemplate({
            id: Number(id),
            org_id,
            user_id,
        });

        if (!template) {
            return res.status(404).json({ message: "Message template not found" });
        }

        res.status(200).json(template);
    } catch (error: any) {
        console.error("Error fetching message template:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateMessageTemplate = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;
        const updateData: UpdateMessageTemplateInput = req.body;

        const template = await messageTemplateService.getMessageTemplate({
            id: Number(id),
            org_id,
            user_id,
        });
        if (!template) {
            return res.status(404).json({ message: "Message template not found" });
        }

        updateData.updated_by = user_id;

        await messageTemplateService.updateMessageTemplate(template, updateData);
        res.status(200).json({ message: "Message template updated successfully" });
    } catch (error: any) {
        console.error("Error updating message template:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteMessageTemplate = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;

        const template = await messageTemplateService.getMessageTemplate({
            id: Number(id),
            org_id,
            user_id,
        });
        if (!template) {
            return res.status(404).json({ message: "Message template not found" });
        }

        await messageTemplateService.deleteMessageTemplate({ id: Number(id) }, user_id);
        res.status(200).json({ message: "Message template deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting message template:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
