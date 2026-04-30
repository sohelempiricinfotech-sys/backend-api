import { Request, Response } from "express";
import * as roleService from "./role.services";
import { CreateRoleInput, UpdateRoleInput } from "./role.type";

export const createRole = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { role, modules } = req.body;

        const input: CreateRoleInput = {
            org_id: orgId,
            role,
            modules,
            created_by: req.loginUser.user.id,
            updated_by: null,
            deleted_by: null,
        };

        const result = await roleService.createRole(input);
        res.status(201).json(result);
    } catch (error) {
        console.error("Error creating role:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getRoles = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const roles = await roleService.getRoles({ org_id: orgId });
        res.status(200).json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getRole = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;
        const role = await roleService.getRole({ id: Number(id), org_id: orgId });

        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        res.status(200).json(role);
    } catch (error) {
        console.error("Error fetching role:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;
        const updateData: UpdateRoleInput = req.body;

        const role = await roleService.getRole({ id: Number(id), org_id: orgId });
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        // Add updated_by
        updateData.updated_by = req.loginUser.user.id;

        await roleService.updateRole(role, updateData);
        res.status(200).json({ message: "Role updated successfully" });
    } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    try {
        const orgId = req.loginUser.user.org_id;
        const { id } = req.params;

        const role = await roleService.getRole({ id: Number(id), org_id: orgId });
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        // Soft delete
        await roleService.deleteRole({ id: Number(id) }, req.loginUser.user.id);
        res.status(200).json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Error deleting role:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
