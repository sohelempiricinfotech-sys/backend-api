import { Request, Response } from "express";
import * as projectService from "./projects.services";
import { getUser } from "../users/user.services";
import { getProfilePhotoSignedUrl } from "../../utility/s3";


export const createProject = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const validatedData = {
            ...req.body,
            org_id,
            created_by: user_id,
        };

        const project = await projectService.createProject(validatedData);
        return res.status(201).json({ message: "Project created successfully", data: project });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const getProjects = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const { page = 1, limit = 10, search, client_id } = req.query;

        const result = await projectService.getProjects(
            org_id,
            Number(page),
            Number(limit),
            search as string,
            client_id ? Number(client_id) : undefined
        );

        return res.status(200).json({ message: "Projects fetched successfully", data: result });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;
        const validatedData = {
            ...req.body,
            updated_by: user_id,
        };

        const project = await projectService.updateProject(
            Number(id),
            org_id,
            validatedData
        );

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        return res.status(200).json({ message: "Project updated successfully", data: project });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const { id } = req.params;

        const project = await projectService.getProjectById(Number(id), org_id);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Resolve assignees as {value, label, image} for the form dropdown
        const assignees: { value: string; label: string; image: string | null }[] = [];
        if (project.assignee_ids && project.assignee_ids.length > 0) {
            for (const uid of project.assignee_ids) {
                const user = await getUser({ id: uid, org_id });
                if (user) {
                    let image: string | null = null;
                    try {
                        image = (await getProfilePhotoSignedUrl(user.id)) || null;
                    } catch { /* ignore */ }
                    assignees.push({
                        value: String(user.id),
                        label: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
                        image,
                    });
                }
            }
        }

        return res.status(200).json({
            message: "Project fetched successfully",
            data: { ...project, assignees },
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;

        await projectService.deleteProject(Number(id), org_id, user_id);

        return res.status(200).json({ message: "Project deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
