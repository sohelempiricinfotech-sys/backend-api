import express from "express";
import {
  getResumesController,
  deleteResumeController,
} from "./resume.controller";

const router = express.Router({ mergeParams: true });

router.get("/", getResumesController);
router.delete("/:resumeId", deleteResumeController);

export default router;
