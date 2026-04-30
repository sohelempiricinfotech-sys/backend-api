import express from "express";
import { zValidate } from "../../midddleware/zvalidate";
import { upsertSmtpSettingsSchema } from "./smtp-settings.validation";
import { getSmtpSettingsController, upsertSmtpSettingsController } from "./smtp-settings.controller";

const router = express.Router();

router.get("/", getSmtpSettingsController);
router.put("/", zValidate(upsertSmtpSettingsSchema), upsertSmtpSettingsController);

export default router;
