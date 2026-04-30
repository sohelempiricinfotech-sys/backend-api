import { Request, Response } from "express";
import * as sourceService from "./source.services";
import { CreateSourceInput, UpdateSourceInput } from "./source.type";
import { reindexBySource } from "../../elastic-index/reindex/reindex-source";

export const createSource = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { source } = req.body;

        const input: CreateSourceInput = {
            org_id: orgId,
            source,
            order: null,
            created_by: req.loginUser.user.id,
            updated_by: null,
            deleted_by: null,
        };

        const result = await sourceService.createSource(input);
        res.status(201).json(result);
    } catch (error) {
        console.error("Error creating source:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSources = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const sources = await sourceService.getSources({ org_id: orgId });
        res.status(200).json(sources);
    } catch (error) {
        console.error("Error fetching sources:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSource = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;
        const source = await sourceService.getSource({ id: Number(id), org_id: orgId });

        if (!source) {
            return res.status(404).json({ message: "Source not found" });
        }

        res.status(200).json(source);
    } catch (error) {
        console.error("Error fetching source:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateSource = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;
        const updateData: UpdateSourceInput = req.body;

        const source = await sourceService.getSource({ id: Number(id), org_id: orgId });
        if (!source) {
            return res.status(404).json({ message: "Source not found" });
        }

        // reindex data by source
        updateData.updated_by = req.loginUser.user.id;

        await sourceService.updateSource(source, updateData);
        reindexBySource(Number(id), orgId);
        res.status(200).json({ message: "Source updated successfully" });
    } catch (error) {
        console.error("Error updating source:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteSource = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;

        const source = await sourceService.getSource({ id: Number(id), org_id: orgId });
        if (!source) {
            return res.status(404).json({ message: "Source not found" });
        }

        // Soft delete
        await sourceService.deleteSource({ id: Number(id) }, req.loginUser.user.id);
        res.status(200).json({ message: "Source deleted successfully" });
    } catch (error) {
        console.error("Error deleting source:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
