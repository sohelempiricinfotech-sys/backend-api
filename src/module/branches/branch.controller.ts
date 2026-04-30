import { Request, Response } from "express";
import * as branchService from "./branch.services";

export const createBranch = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const client_id = Number(req.params.clientId);
        const validatedData = {
            ...req.body,
            org_id,
            client_id,
            created_by: user_id,
        };

        const branch = await branchService.createBranch(validatedData);
        return res.status(201).json({ message: "Branch created successfully", data: branch });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getBranches = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const client_id = Number(req.params.clientId);
        const { page = 1, limit = 10, search } = req.query;

        const result = await branchService.getBranches(
            org_id,
            client_id,
            Number(page),
            Number(limit),
            search as string
        );

        return res.status(200).json({ message: "Branches fetched successfully", data: result });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getBranchById = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const client_id = Number(req.params.clientId);
        const { id } = req.params;

        const branch = await branchService.getBranchById(Number(id), org_id, client_id);

        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }

        return res.status(200).json({ message: "Branch fetched successfully", data: branch });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const updateBranch = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const client_id = Number(req.params.clientId);
        const { id } = req.params;
        const validatedData = {
            ...req.body,
            updated_by: user_id,
        };

        const branch = await branchService.updateBranch(
            Number(id),
            org_id,
            client_id,
            validatedData
        );

        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }

        return res.status(200).json({ message: "Branch updated successfully", data: branch });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const deleteBranch = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const client_id = Number(req.params.clientId);
        const { id } = req.params;

        await branchService.deleteBranch(Number(id), org_id, client_id, user_id);

        return res.status(200).json({ message: "Branch deleted successfully" });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};
