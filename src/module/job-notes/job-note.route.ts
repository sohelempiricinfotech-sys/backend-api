import express from "express";
import {
  getJobNotesController,
  createJobNoteController,
  updateJobNoteController,
  deleteJobNoteController,
} from "./job-note.controller";

const router = express.Router({ mergeParams: true });

router.get("/", getJobNotesController);
router.post("/", createJobNoteController);
router.patch("/:noteId", updateJobNoteController);
router.delete("/:noteId", deleteJobNoteController);

export default router;
