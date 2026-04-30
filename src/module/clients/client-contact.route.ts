import { Router } from "express";
import * as contactController from "./client-contact.controller";
import { contactPhotoUpload } from "./client-contact.controller";
import { zValidate } from "../../midddleware/zvalidate";
import { createContactSchema, updateContactSchema } from "./client-contact.validation";

const router = Router({ mergeParams: true });

router.get("/", contactController.getContacts);
router.post("/", zValidate(createContactSchema), contactController.createContact);
router.patch("/:id", zValidate(updateContactSchema), contactController.updateContact);
router.delete("/:id", contactController.deleteContact);
router.post("/:id/upload-photo", contactPhotoUpload.single("photo"), contactController.uploadContactPhoto);

export default router;
