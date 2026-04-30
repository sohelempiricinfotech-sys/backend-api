import { Request, Response } from "express";
import { getUser } from "../users/user.services";
import { IsNull } from "typeorm";
import { AppDataSource } from "../../data-source";
import { User } from "../users/user.model";
import multer from "multer";
import sharp from "sharp";
import { uploadFileToS3, getProfilePhotoKey, getProfilePhotoSignedUrl, getOrgLogoSignedUrl } from "../../utility/s3";
import { reindexByUser } from "../../elastic-index/reindex/reindex-user";
import { getOrgSettings } from "../organizations/organization.services";
import { validatePassword, hashPassword } from "../../helper/bcryptHelper";

const userRepository = AppDataSource.getRepository(User);

const PROFILE_SELECT_FIELDS: (keyof User)[] = [
  "id",
  "org_id",
  "unique_id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "system_role",
  "status",
  "created_at",
  "updated_at",
];

export const getProfileController = async (req: Request, res: Response) => {
  try {
    const { id: user_id, org_id } = req.loginUser.user;

    const user = await userRepository.findOne({
      where: { id: user_id, org_id, deleted_at: IsNull() },
      select: PROFILE_SELECT_FIELDS,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let profilePhotoUrl: string | null = null;
    try {
      profilePhotoUrl = await getProfilePhotoSignedUrl(user_id);
    } catch {
      profilePhotoUrl = null;
    }

    // Fetch org name + logo for admin panel header
    let org_name: string | null = null;
    let org_slug: string | null = null;
    let org_logo_url: string | null = null;
    let org_tagline: string | null = null;
    try {
      const org = await getOrgSettings(org_id);
      if (org) {
        org_name = org.name;
        org_slug = org.slug;
        org_tagline = org.tagline;
        if (org.has_logo) {
          try {
            org_logo_url = await getOrgLogoSignedUrl(org_id);
          } catch {
            org_logo_url = null;
          }
        }
      }
    } catch {
      // org fetch failed — non-critical
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      data: { ...user, profile_photo_url: profilePhotoUrl, org_name, org_slug, org_logo_url, org_tagline },
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const { id: user_id, org_id } = req.loginUser.user;
    const { first_name, last_name, phone } = req.body;

    const user = await getUser({ id: user_id, org_id, deleted_at: IsNull() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (phone !== undefined) user.phone = phone;
    user.updated_by = user_id;

    await userRepository.save(user);

    // reindex data by user
    reindexByUser(user_id, org_id);

    const updatedUser = await userRepository.findOne({
      where: { id: user_id, org_id, deleted_at: IsNull() },
      select: PROFILE_SELECT_FIELDS,
    });

    let profilePhotoUrl: string | null = null;
    try {
      profilePhotoUrl = await getProfilePhotoSignedUrl(user_id);
    } catch {
      profilePhotoUrl = null;
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      data: { ...updatedUser, profile_photo_url: profilePhotoUrl },
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

export const uploadProfilePhotoController = async (req: Request, res: Response) => {
  try {
    const { id: user_id, org_id } = req.loginUser.user;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user = await getUser({ id: user_id, org_id, deleted_at: IsNull() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Convert image to webp format
    const webpBuffer = await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const s3Key = getProfilePhotoKey(user_id);

    await uploadFileToS3(webpBuffer, s3Key, "image/webp");

    const profilePhotoUrl = await getProfilePhotoSignedUrl(user_id);

    return res.status(200).json({
      message: "Profile photo uploaded successfully",
      data: { profile_photo_url: profilePhotoUrl },
    });
  } catch (error: any) {
    console.error("Error uploading profile photo:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const changePasswordController = async (req: Request, res: Response) => {
  try {
    const { id: user_id, org_id } = req.loginUser.user;
    const { current_password, new_password } = req.body;

    const user = await userRepository.findOne({
      where: { id: user_id, org_id, deleted_at: IsNull() },
      select: ["id", "password", "is_password"],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.password || !user.is_password) {
      return res.status(400).json({ error: "Password login is not enabled for this account" });
    }

    const isCurrentValid = await validatePassword(current_password, user.password);
    if (!isCurrentValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await hashPassword(new_password);
    await userRepository.update(
      { id: user_id, org_id },
      { password: hashedPassword, updated_by: user_id },
    );

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Error changing password:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
