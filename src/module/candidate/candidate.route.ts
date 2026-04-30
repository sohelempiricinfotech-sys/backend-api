import express from "express";
import {
    createCandidate,
    getCandidates,
    getCandidateById,
    deleteCandidate,
    updateCandidate,
    toggleCandidateJoined,
    sendEmailToUsersHandler,
    sendEmailAllCandidatesHandler,
} from "./candidate.controller";
import { zValidate } from "../../midddleware/zvalidate";
import { createCandidateType, updateCandidateType, toggleCandidateJoinedSchema, sendEmailToUsersSchema, sendEmailAllCandidatesSchema } from "./candidate.type";

const router = express.Router();

router.post("/", zValidate(createCandidateType), createCandidate);
router.get("/", getCandidates);

// POST /api/candidates/send-email — send email to candidates by user IDs
router.post("/send-email", zValidate(sendEmailToUsersSchema), sendEmailToUsersHandler);

// POST /api/candidates/send-email-all — send email to all matching candidates
router.post("/send-email-all", zValidate(sendEmailAllCandidatesSchema), sendEmailAllCandidatesHandler);

router.get("/:id", getCandidateById);
router.patch("/:id/toggle-joined", zValidate(toggleCandidateJoinedSchema), toggleCandidateJoined);
router.patch("/:id", zValidate(updateCandidateType), updateCandidate);
router.delete("/:id", deleteCandidate);

export default router;
