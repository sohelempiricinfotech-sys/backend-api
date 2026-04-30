import { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { AppDataSource } from "../../data-source";
import { User } from "../../module/users/user.model";
import { uploadFileToS3, getFileUrl, getProfilePhotoKey, getProfilePhotoSignedUrl } from "../../utility/s3";
import * as resumeService from "../../module/resumes/resume.services";
import { parseResumeText, buildResumeParsePrompt } from "../../module/resumes/resume.parse";
import { getAIResponse } from "../../module/ai/ai.services";
import { findOrCreateSkill } from "../../module/skills/skill.services";

const userRepository = AppDataSource.getRepository(User);

// --- Multer for profile photo ---
export const photoUpload = multer({
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

// --- Multer for resume ---
export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  },
});

/**
 * POST /api/portal/candidate/upload-photo
 * Upload profile photo to S3, update user record.
 */
export const uploadPortalPhoto = async (req: Request, res: Response) => {
  try {
    const { id, org_id } = req.portalUser;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user = await userRepository.findOneBy({ id, org_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Convert image to webp format
    const webpBuffer = await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const s3Key = getProfilePhotoKey(id);

    await uploadFileToS3(webpBuffer, s3Key, "image/webp");

    const profilePhotoUrl = await getProfilePhotoSignedUrl(id);

    return res.status(200).json({
      message: "Profile photo uploaded successfully",
      data: { profile_photo_url: profilePhotoUrl },
    });
  } catch (error: any) {
    console.error("Portal upload photo error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * POST /api/portal/candidate/upload-resume
 * Upload resume file to S3 (no DB record, returns file info for frontend to save).
 */
export const uploadPortalResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const originalName = req.file.originalname;
    const s3Key = `resumes/${uuidv4()}-${originalName}`;

    await uploadFileToS3(req.file.buffer, s3Key, req.file.mimetype);

    const fileUrl = await getFileUrl(s3Key);

    return res.status(200).json({
      message: "Resume uploaded successfully",
      data: {
        file_name: originalName,
        file_path: s3Key,
        file_url: fileUrl,
      },
    });
  } catch (error: any) {
    console.error("Portal upload resume error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * POST /api/portal/candidate/resumes
 * Upload resume to S3, create DB record, AND auto-parse with AI.
 * Returns resume info + parsed_data (null if parse fails).
 */
export const createPortalResume = async (req: Request, res: Response) => {
  try {
    const { id, org_id } = req.portalUser;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const originalName = req.file.originalname;
    const s3Key = `resumes/${uuidv4()}-${originalName}`;

    await uploadFileToS3(req.file.buffer, s3Key, req.file.mimetype);

    const resume = await resumeService.createResume({
      org_id,
      user_id: id,
      file_name: originalName,
      file_path: s3Key,
      created_by: id,
      updated_by: null,
      deleted_by: null,
    });

    const fileUrl = await getFileUrl(s3Key);

    // Auto-parse resume with AI (non-blocking: if parse fails, still return resume info)
    let parsed_data = null;
    try {
      const resumeText = await parseResumeText(s3Key);
      const prompt = buildResumeParsePrompt(resumeText);
      const aiResponse = await getAIResponse({ prompt, maxTokens: 2048, temperature: 0.7 });
      const resumeData = JSON.parse(aiResponse.content);

      if (resumeData.skills) {
        resumeData.skills = await Promise.all(
          resumeData.skills.map(async (skill: string) => {
            const s = await findOrCreateSkill(skill, org_id);
            return { value: String(s.id), label: s.name };
          })
        );
      }

      parsed_data = resumeData;
    } catch (parseError: any) {
      console.error("Resume auto-parse failed (non-fatal):", parseError.message);
    }

    return res.status(201).json({
      message: "Resume created successfully",
      data: {
        id: resume.id,
        file_name: resume.file_name,
        file_path: resume.file_path,
        file_url: fileUrl,
        parsed_data,
      },
    });
  } catch (error: any) {
    console.error("Portal create resume error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * POST /api/portal/candidate/parse-resume
 * Parse an already-uploaded resume using AI. Returns structured data.
 * Body: { file_path: string }
 */
export const parsePortalResume = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.portalUser;
    const { file_path } = req.body;

    if (!file_path) {
      return res.status(400).json({ error: "file_path is required" });
    }

    const resumeText = await parseResumeText(file_path);
    const prompt = buildResumeParsePrompt(resumeText);
    const aiResponse = await getAIResponse({ prompt, maxTokens: 2048, temperature: 0.7 });
    const resumeData = JSON.parse(aiResponse.content);

    if (resumeData.skills) {
      resumeData.skills = await Promise.all(
        resumeData.skills.map(async (skill: string) => {
          const s = await findOrCreateSkill(skill, org_id);
          return { value: String(s.id), label: s.name };
        })
      );
    }

    return res.status(200).json({
      message: "Resume parsed successfully",
      data: resumeData,
    });
  } catch (error: any) {
    console.error("Portal parse resume error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
