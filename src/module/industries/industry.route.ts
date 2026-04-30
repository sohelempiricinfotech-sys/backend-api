import express from "express";
import { createIndustrySchema, updateIndustrySchema } from "./industry.validation";
import * as industryController from "./industry.controller";
import { zValidate } from "../../midddleware/zvalidate";
import { adminOnly } from "../../midddleware/admin-only";

const router = express.Router();

router.post("/", adminOnly, zValidate(createIndustrySchema), industryController.createIndustry);
router.get("/", industryController.getIndustries);
router.get("/:id", industryController.getIndustry);
router.patch("/:id", adminOnly, zValidate(updateIndustrySchema), industryController.updateIndustry);
router.delete("/:id", adminOnly, industryController.deleteIndustry);

export default router;
