import { Router } from "express";
import { zValidate } from "../../midddleware/zvalidate";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "./portal-candidate.validation";
import {
  getProfile,
  updateProfile,
  changePassword,
  getExperiences,
  completeOnboarding,
} from "./portal-candidate.controller";
import {
  getPortalSkills,
  getPortalIndustries,
} from "./portal-candidate-data.controller";
import {
  photoUpload,
  resumeUpload,
  uploadPortalPhoto,
  uploadPortalResume,
  createPortalResume,
  parsePortalResume,
} from "./portal-file-upload.controller";
import { verifyRecaptcha } from "../middleware/recaptcha.middleware";

const router = Router();

// All routes require portalAuthMiddleware (applied in server.ts)
router.get("/profile", getProfile);
router.patch("/profile", zValidate(updateProfileSchema), updateProfile);
router.post(
  "/change-password",
  zValidate(changePasswordSchema),
  changePassword
);
router.get("/experiences", getExperiences);
router.post("/complete-onboarding", completeOnboarding);

// Data endpoints (skills, industries)
router.get("/skills", getPortalSkills);
router.get("/industries", getPortalIndustries);

// File upload endpoints
router.post("/upload-photo", photoUpload.single("photo"), uploadPortalPhoto);
router.post("/upload-resume", resumeUpload.single("resume"), uploadPortalResume);
router.post("/resumes", resumeUpload.single("resume"), verifyRecaptcha("upload_resume"), createPortalResume);
router.post("/parse-resume", verifyRecaptcha("parse_resume"), parsePortalResume);

export default router;
