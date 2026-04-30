import { Router } from "express";
import { zValidate } from "../../midddleware/zvalidate";
import {
  dashboardStatsSchema,
  dashboardChartSchema,
  candidatesByStateSchema,
} from "./dashboard.validation";
import {
  getDashboardStatsHandler,
  getDashboardChartHandler,
  getCandidatesByStateHandler,
} from "./dashboard.controller";

const router = Router();

router.post("/stats", zValidate(dashboardStatsSchema), getDashboardStatsHandler);
router.post("/chart", zValidate(dashboardChartSchema), getDashboardChartHandler);
router.post("/candidates-by-state", zValidate(candidatesByStateSchema), getCandidatesByStateHandler);

export default router;
