import express from "express";
import { zValidate } from "../../midddleware/zvalidate";
import { updateProfileSchema, changePasswordSchema } from "./profile.validation";
import {
  getProfileController,
  updateProfileController,
  uploadProfilePhotoController,
  changePasswordController,
  upload,
} from "./profile.controller";

const router = express.Router();

router.get("/", getProfileController);
router.patch("/", zValidate(updateProfileSchema), updateProfileController);
router.post("/upload-photo", upload.single("photo"), uploadProfilePhotoController);
router.patch("/change-password", zValidate(changePasswordSchema), changePasswordController);

export default router;
