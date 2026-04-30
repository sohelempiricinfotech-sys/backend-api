import { Request, Response } from "express";
import * as industryService from "./industry.services";
import { CreateIndustryInput, UpdateIndustryInput } from "./industry.type";
import { reindexByIndustry } from "../../elastic-index/reindex/reindex-industry";

export const createIndustry = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { industry } = req.body;

        const input: CreateIndustryInput = {
            org_id: orgId,
            industry,
            order: null,
            created_by: req.loginUser.user.id,
            updated_by: null,
            deleted_by: null,
        };

        const result = await industryService.createIndustry(input);
        res.status(201).json(result);
    } catch (error) {
        console.error("Error creating industry:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getIndustries = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const industries = await industryService.getIndustries({ org_id: orgId });
        res.status(200).json(industries);
    } catch (error) {
        console.error("Error fetching industries:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getIndustry = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;
        const industry = await industryService.getIndustry({ id: Number(id), org_id: orgId });

        if (!industry) {
            return res.status(404).json({ message: "Industry not found" });
        }

        res.status(200).json(industry);
    } catch (error) {
        console.error("Error fetching industry:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateIndustry = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;
        const updateData: UpdateIndustryInput = req.body;

        const industry = await industryService.getIndustry({ id: Number(id), org_id: orgId });
        if (!industry) {
            return res.status(404).json({ message: "Industry not found" });
        }

        // Add updated_by
        updateData.updated_by = req.loginUser.user.id;

        await industryService.updateIndustry(industry, updateData);

        // reindex data by industry
        reindexByIndustry(Number(id), orgId);

        res.status(200).json({ message: "Industry updated successfully" });
    } catch (error) {
        console.error("Error updating industry:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteIndustry = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;

        const industry = await industryService.getIndustry({ id: Number(id), org_id: orgId });
        if (!industry) {
            return res.status(404).json({ message: "Industry not found" });
        }

        // Soft delete
        await industryService.deleteIndustry({ id: Number(id) }, req.loginUser.user.id);
        res.status(200).json({ message: "Industry deleted successfully" });
    } catch (error) {
        console.error("Error deleting industry:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
