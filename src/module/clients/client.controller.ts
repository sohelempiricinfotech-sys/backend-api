import { Request, Response } from "express";
import * as clientService from "./client.services";

export const createClient = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const validatedData = {
            ...req.body,
            org_id,
            created_by: user_id,
        };

        const client = await clientService.createClient(validatedData);
        return res.status(201).json({ message: "Client created successfully", data: client });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getClients = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const { page = 1, limit = 10, search } = req.query;

        const result = await clientService.getClients(
            org_id,
            Number(page),
            Number(limit),
            search as string
        );

        return res.status(200).json({ message: "Clients fetched successfully", data: result });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getClientById = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const { id } = req.params;

        const client = await clientService.getClientById(Number(id), org_id);

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        return res.status(200).json({ message: "Client fetched successfully", data: client });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const updateClient = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;
        const validatedData = {
            ...req.body,
            updated_by: user_id,
        };

        const client = await clientService.updateClient(
            Number(id),
            org_id,
            validatedData
        );

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        return res.status(200).json({ message: "Client updated successfully", data: client });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const deleteClient = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;

        await clientService.deleteClient(Number(id), org_id, user_id);

        return res.status(200).json({ message: "Client deleted successfully" });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};
