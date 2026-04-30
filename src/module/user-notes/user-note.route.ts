import express from "express";
import {
  getCandidateNotesController,
  createCandidateNoteController,
  updateCandidateNoteController,
  deleteCandidateNoteController,
} from "./user-note.controller";

const router = express.Router({ mergeParams: true });

router.get("/", getCandidateNotesController);
router.post("/", createCandidateNoteController);
router.patch("/:noteId", updateCandidateNoteController);
router.delete("/:noteId", deleteCandidateNoteController);

export default router;
