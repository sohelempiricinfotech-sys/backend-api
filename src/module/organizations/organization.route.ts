import express from "express";
import { zValidate } from "../../midddleware/zvalidate";
import { updateOrgSettingsSchema } from "./organization.validation";
import {
  getOrgSettings,
  updateOrgSettings,
  uploadOrgLogo,
  upload,
} from "./organization.controller";

const router = express.Router();

router.get("/", getOrgSettings);
router.patch("/", zValidate(updateOrgSettingsSchema), updateOrgSettings);
router.post("/upload-logo", upload.single("logo"), uploadOrgLogo);

export default router;
