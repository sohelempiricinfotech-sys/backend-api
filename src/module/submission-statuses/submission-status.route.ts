import { Router } from "express";
import * as submissionStatusController from "./submission-status.controller";
import { zValidate } from "../../midddleware/zvalidate";
import {
    createSubmissionStatusSchema,
    updateSubmissionStatusSchema,
} from "./submission-status.validation";

const router = Router({ mergeParams: true });

router.post("/", zValidate(createSubmissionStatusSchema), submissionStatusController.createSubmissionStatus);
router.get("/", submissionStatusController.getSubmissionStatuses);
router.patch("/:id", zValidate(updateSubmissionStatusSchema), submissionStatusController.updateSubmissionStatus);
router.delete("/:id", submissionStatusController.deleteSubmissionStatus);

export default router;
