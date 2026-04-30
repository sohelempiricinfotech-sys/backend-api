import express from "express";
import { createSourceSchema, updateSourceSchema } from "./source.validation";
import * as sourceController from "./source.controller";
import { zValidate } from "../../midddleware/zvalidate";
import { adminOnly } from "../../midddleware/admin-only";

const router = express.Router();

router.post("/", adminOnly, zValidate(createSourceSchema), sourceController.createSource);
router.get("/", sourceController.getSources);
router.get("/:id", sourceController.getSource);
router.patch("/:id", adminOnly, zValidate(updateSourceSchema), sourceController.updateSource);
router.delete("/:id", adminOnly, sourceController.deleteSource);

export default router;
