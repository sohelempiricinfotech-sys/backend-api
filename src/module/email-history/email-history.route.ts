import { Router } from "express";
import {
  getCandidateEmailHistoryController,
  getSubmissionEmailHistoryController,
} from "./email-history.controller";

const router = Router();

router.get("/candidate/:userId", getCandidateEmailHistoryController);
router.get("/submission/:submissionId", getSubmissionEmailHistoryController);

export default router;
