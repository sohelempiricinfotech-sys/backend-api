import { Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import {
  uploadFileToS3,
  getOrgLogoKey,
  getOrgLogoSignedUrl,
} from "../../utility/s3";
import {
  getOrgSettings as getOrgSettingsFromDb,
  getOrganization,
  saveOrganization,
} from "./organization.services";

export const getOrgSettings = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;

    const org = await getOrgSettingsFromDb(org_id);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    let logo_url: string | null = null;
    if (org.has_logo) {
      try {
        logo_url = await getOrgLogoSignedUrl(org_id);
      } catch {
        logo_url = null;
      }
    }

    return res.status(200).json({
      message: "Organization settings fetched successfully",
      data: { ...org, logo_url },
    });
  } catch (error: any) {
    console.error("Error fetching org settings:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

export const updateOrgSettings = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;

    const org = await getOrganization({ id: org_id });
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const {
      name,
      tagline,
      address,
      social_x,
      social_facebook,
      social_instagram,
      social_linkedin,
      social_youtube,
      social_whatsapp,
    } = req.body;

    if (name !== undefined) org.name = name;
    if (tagline !== undefined) org.tagline = tagline;
    if (address !== undefined) org.address = address;
    if (social_x !== undefined) org.social_x = social_x;
    if (social_facebook !== undefined) org.social_facebook = social_facebook;
    if (social_instagram !== undefined) org.social_instagram = social_instagram;
    if (social_linkedin !== undefined) org.social_linkedin = social_linkedin;
    if (social_youtube !== undefined) org.social_youtube = social_youtube;
    if (social_whatsapp !== undefined) org.social_whatsapp = social_whatsapp;
    org.updated_by = user_id;

    await saveOrganization(org);

    let logo_url: string | null = null;
    if (org.has_logo) {
      try {
        logo_url = await getOrgLogoSignedUrl(org_id);
      } catch {
        logo_url = null;
      }
    }

    return res.status(200).json({
      message: "Organization settings updated successfully",
      data: { ...org, logo_url },
    });
  } catch (error: any) {
    console.error("Error updating org settings:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
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

export const uploadOrgLogo = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const org = await getOrganization({ id: org_id });
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const webpBuffer = await sharp(req.file.buffer)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const s3Key = getOrgLogoKey(org_id);
    await uploadFileToS3(webpBuffer, s3Key, "image/webp");

    org.has_logo = true;
    await saveOrganization(org);

    const logo_url = await getOrgLogoSignedUrl(org_id);

    return res.status(200).json({
      message: "Organization logo uploaded successfully",
      data: { logo_url },
    });
  } catch (error: any) {
    console.error("Error uploading org logo:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
