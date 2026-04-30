import { Router } from "express";
import * as projectController from "./projects.controller";
import { zValidate } from "../../midddleware/zvalidate";
import { createProjectSchema, updateProjectSchema } from "./projects.validation";

const router = Router();

router.post("/", zValidate(createProjectSchema), projectController.createProject);
router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProjectById);
router.patch("/:id", zValidate(updateProjectSchema), projectController.updateProject);
router.delete("/:id", projectController.deleteProject);

export default router;
