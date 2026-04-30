import { Router } from "express";
import { zValidate } from "../../midddleware/zvalidate";
import { portalApplyJobSchema } from "../../module/submissions/submission.validation";
import {
  applyToJob,
  uploadQuestionFile,
  questionFileUpload,
} from "./portal-submissions.controller";

const router = Router();

// POST /api/portal/submissions - Apply to a job
router.post("/", zValidate(portalApplyJobSchema), applyToJob);

// POST /api/portal/submissions/upload-file - Upload file for question answer
router.post("/upload-file", questionFileUpload.single("file"), uploadQuestionFile);

export default router;
