import { Request, Response } from "express";
import {
  createUser,
  deleteUser,
  getUser,
  getUsersList,
  updateUser,
} from "./user.services";
import { CreateUserInput } from "./user.type";
import { hashPassword } from "../../helper/bcryptHelper";
import { generateUniqueId } from "../../utility/uniqueid";
import { SystemRole } from "./user.model";
import { IsNull } from "typeorm";
import { reindexByUser } from "../../elastic-index/reindex/reindex-user";
import { getProfilePhotoSignedUrl } from "../../utility/s3";

export const createUserController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { first_name, last_name, email, phone, password, system_role } = req.body;

    const existingUser = await getUser({ email, org_id, deleted_at: IsNull() });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists with this email" });
    }

    const role = system_role || SystemRole.EMPLOYEE;
    const newUser: CreateUserInput = {
      org_id,
      role_id: null,
      unique_id: generateUniqueId(role as SystemRole),
      first_name,
      last_name: last_name || null,
      email,
      phone: phone || null,
      password: await hashPassword(password),
      oneTimeVerificationCode: null,
      is_password: true,
      is_verified: false,
      status: "Active",
      system_role: role,
      user_detail: null,
      access_token: null,
      refresh_token: null,
      two_factor_otp: null,
      otp_expires_at: null,
      login_attempts: 0,
      login_attempts_at: null,
      resume_views_by_user: 0,
      resume_view_reset_time: null,
      file_download_count: 0,
      file_download_reset_time: null,
      onboard: true,
      profile_photo: null,
      created_by: user_id,
      updated_by: null,
      deleted_by: null,
    };

    await createUser(newUser);
    return res.status(201).json({ message: "User created successfully" });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;
    const { id } = req.params;

    const user = await getUser({ id: Number(id), org_id, deleted_at: IsNull() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, access_token, refresh_token, two_factor_otp, oneTimeVerificationCode, ...safeUser } = user;
    return res.status(200).json({ message: "User fetched successfully", data: safeUser });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { id } = req.params;
    const { first_name, last_name, email, phone, system_role } = req.body;

    const user = await getUser({ id: Number(id), org_id, deleted_at: IsNull() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData: Record<string, any> = { updated_by: user_id };
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (system_role !== undefined) updateData.system_role = system_role;

    await updateUser({ id: Number(id) }, user, updateData);

    // reindex data by user
    reindexByUser(Number(id), org_id);

    return res.status(200).json({ message: "User updated successfully" });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { id } = req.params;

    const user = await getUser({ id: Number(id), org_id, deleted_at: IsNull() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await deleteUser(
      { id: Number(id), org_id },
      { deleted_at: new Date(), status: "deleted", deleted_by: user_id }
    );

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const filterUsers = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;
    const { page = 1, limit = 20, search, system_role } = req.query;

    const result = await getUsersList(org_id, {
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      system_role: system_role as string,
    });

    const usersWithPhotos = await Promise.all(
      result.users.map(async (user: any) => {
        let profile_photo_url: string | null = null;
        try {
          profile_photo_url = await getProfilePhotoSignedUrl(user.id);
        } catch { /* ignore */ }
        return { ...user, profile_photo_url };
      })
    );

    return res.status(200).json({
      message: "Users fetched successfully",
      data: { ...result, users: usersWithPhotos },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
