import { Router } from "express";
import { getPublicCandidateProfile } from "./portal-candidate-public.controller";

const router = Router();

router.get("/:id/public", getPublicCandidateProfile);

export default router;
