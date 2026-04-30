import { Request, Response } from "express";
import * as skillService from "./skill.services";
import { CreateSkillInput, UpdateSkillInput } from "./skill.type";
import { reindexBySkill } from "../../elastic-index/reindex/reindex-skill";

export const createSkill = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { name } = req.body;

        const input: CreateSkillInput = {
            org_id: orgId,
            name,
            lower_name: skillService.getSkillLowerName(name),
            created_by: req.loginUser.user.id,
            updated_by: null,
            deleted_by: null,
        };

        const result = await skillService.createSkill(input);
        res.status(201).json(result);
    } catch (error) {
        console.error("Error creating skill:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSkills = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = (req.query.search as string) || undefined;

        const result = await skillService.getSkillsList(orgId, { page, limit, search });

        res.status(200).json({
            data: {
                skills: result.skills,
                total: result.total,
                hasMore: !result.isLast,
            },
        });
    } catch (error) {
        console.error("Error fetching skills:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSkillsList = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string | undefined;

        const result = await skillService.getSkillsList(orgId, { page, limit, search });

        res.status(200).json({
            data: result.skills.map(skill => ({
                value: skill.id.toString(),
                label: skill.name,
            })),
            total: result.total,
            isLast: result.isLast,
        });
    } catch (error) {
        console.error("Error fetching skills list:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSkill = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;
        const skill = await skillService.getSkill({ id: Number(id), org_id: orgId });

        if (!skill) {
            return res.status(404).json({ message: "Skill not found" });
        }

        res.status(200).json(skill);
    } catch (error) {
        console.error("Error fetching skill:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateSkill = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;
        const updateData: UpdateSkillInput = req.body;

        const skill = await skillService.getSkill({ id: Number(id), org_id: orgId });
        if (!skill) {
            return res.status(404).json({ message: "Skill not found" });
        }

        delete updateData.lower_name;

        // Add updated_by
        updateData.updated_by = req.loginUser.user.id;
        if (updateData.name) updateData.lower_name = skillService.getSkillLowerName(updateData.name);

        await skillService.updateSkill(skill, updateData);

        // reindex data by skill
        reindexBySkill(Number(id), orgId);

        res.status(200).json({ message: "Skill updated successfully" });
    } catch (error) {
        console.error("Error updating skill:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteSkill = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;

        const skill = await skillService.getSkill({ id: Number(id), org_id: orgId });
        if (!skill) {
            return res.status(404).json({ message: "Skill not found" });
        }

        // Soft delete
        await skillService.deleteSkill({ id: Number(id) }, req.loginUser.user.id);
        res.status(200).json({ message: "Skill deleted successfully" });
    } catch (error) {
        console.error("Error deleting skill:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
