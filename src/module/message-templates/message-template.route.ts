import express from "express";
import { createMessageTemplateSchema, updateMessageTemplateSchema } from "./message-template.validation";
import * as messageTemplateController from "./message-template.controller";
import { zValidate } from "../../midddleware/zvalidate";

const router = express.Router();

router.post("/", zValidate(createMessageTemplateSchema), messageTemplateController.createMessageTemplate);
router.get("/", messageTemplateController.getMessageTemplates);
router.get("/:id", messageTemplateController.getMessageTemplate);
router.patch("/:id", zValidate(updateMessageTemplateSchema), messageTemplateController.updateMessageTemplate);
router.delete("/:id", messageTemplateController.deleteMessageTemplate);

export default router;
