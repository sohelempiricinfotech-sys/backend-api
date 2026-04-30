import express from "express";
import { createRoleSchema, updateRoleSchema } from "./role.validation";
import * as roleController from "./role.controller";
import { zValidate } from "../../midddleware/zvalidate";

const router = express.Router();

router.post("/", zValidate(createRoleSchema), roleController.createRole);
router.get("/", roleController.getRoles);
router.get("/:id", roleController.getRole);
router.patch("/:id", zValidate(updateRoleSchema), roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

export default router;
