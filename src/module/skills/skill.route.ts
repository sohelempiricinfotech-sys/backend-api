import express from "express";
import { createSkillSchema, updateSkillSchema } from "./skill.validation";
import * as skillController from "./skill.controller";
import { zValidate } from "../../midddleware/zvalidate";

const router = express.Router();

router.post("/", zValidate(createSkillSchema), skillController.createSkill);
router.get("/", skillController.getSkills);
router.get("/list", skillController.getSkillsList);
router.get("/:id", skillController.getSkill);
router.patch("/:id", zValidate(updateSkillSchema), skillController.updateSkill);
router.delete("/:id", skillController.deleteSkill);

export default router;
