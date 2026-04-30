import { Router } from "express";
import { getPortalJobs, getPortalJob, getPortalFilterOptions, getPortalSkills, getPortalOrgInfo } from "./portal-jobs.controller";

const router = Router();

// Public portal routes (no auth required, org resolved from X-Org-Slug header)
router.get("/filter-options", getPortalFilterOptions);
router.get("/skills", getPortalSkills);
router.get("/org-info", getPortalOrgInfo);
router.get("/", getPortalJobs);
router.get("/:id", getPortalJob);

export default router;
