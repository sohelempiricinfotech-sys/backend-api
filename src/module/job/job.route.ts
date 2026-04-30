import { Router } from "express";
import * as jobController from "./job.controller";
import { zValidate } from "../../midddleware/zvalidate";
import { createJobPostSchema, updateJobPostSchema, toggleJobPublishedSchema } from "./job.validation";

const router = Router();

router.post("/", zValidate(createJobPostSchema), jobController.createJob);
router.post("/generate-jd", jobController.generateJobDescription);
router.get("/", jobController.getJobs);
router.get("/:id", jobController.getJob);
router.patch("/:id/toggle-published", zValidate(toggleJobPublishedSchema), jobController.toggleJobPublished);
router.patch("/:id", zValidate(updateJobPostSchema), jobController.updateJob);
router.delete("/:id", jobController.deleteJob);

export default router;
