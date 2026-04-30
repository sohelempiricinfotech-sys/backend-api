import { Router } from "express";
import { getSubmissions, getSubmissionQnA, getSubmissionResume, updateSubmissionQnA, bulkSubmitCandidates, bulkSubmitAllCandidates, bulkUpdateSubmissionStatusHandler, bulkUpdateAllSubmissionStatusHandler, copySubmissionsToJobHandler, copyAllSubmissionsToJobHandler, markSubmissionReadHandler, markSubmissionUnreadHandler, sendEmailBySubmissionIdsHandler, sendEmailAllSubmissionsHandler } from "./submission.controller";
import { zValidate } from "../../midddleware/zvalidate";
import { bulkSubmitSchema, bulkSubmitAllSchema, updateSubmissionQnASchema, bulkUpdateSubmissionStatusSchema, bulkUpdateAllSubmissionStatusSchema, copySubmissionsToJobSchema, copyAllSubmissionsToJobSchema, sendEmailBySubmissionIdsSchema, sendEmailAllSubmissionsSchema } from "./submission.validation";

const router = Router();

// GET /api/submissions?job_id=xxx&status_id=yyy
router.get("/", getSubmissions);

// POST /api/submissions/bulk
router.post("/bulk", zValidate(bulkSubmitSchema), bulkSubmitCandidates);

// POST /api/submissions/bulk-all — submit all candidates matching filters
router.post("/bulk-all", zValidate(bulkSubmitAllSchema), bulkSubmitAllCandidates);

// PATCH /api/submissions/bulk-status — bulk update submission status
router.patch("/bulk-status", zValidate(bulkUpdateSubmissionStatusSchema), bulkUpdateSubmissionStatusHandler);

// PATCH /api/submissions/bulk-status-all — bulk update ALL matching submissions' status
router.patch("/bulk-status-all", zValidate(bulkUpdateAllSubmissionStatusSchema), bulkUpdateAllSubmissionStatusHandler);

// POST /api/submissions/copy-to-job — copy submissions to another job
router.post("/copy-to-job", zValidate(copySubmissionsToJobSchema), copySubmissionsToJobHandler);

// POST /api/submissions/copy-all-to-job — copy ALL matching submissions to another job
router.post("/copy-all-to-job", zValidate(copyAllSubmissionsToJobSchema), copyAllSubmissionsToJobHandler);

// POST /api/submissions/send-email-by-submissions — send email to candidates by submission IDs
router.post("/send-email-by-submissions", zValidate(sendEmailBySubmissionIdsSchema), sendEmailBySubmissionIdsHandler);

// POST /api/submissions/send-email-all — send email to all matching submissions
router.post("/send-email-all", zValidate(sendEmailAllSubmissionsSchema), sendEmailAllSubmissionsHandler);

// PATCH /api/submissions/:id/read — mark submission as read
router.patch("/:id/read", markSubmissionReadHandler);

// PATCH /api/submissions/:id/unread — mark submission as unread
router.patch("/:id/unread", markSubmissionUnreadHandler);

// GET /api/submissions/:id/resume
router.get("/:id/resume", getSubmissionResume);

// GET /api/submissions/:id/qna
router.get("/:id/qna", getSubmissionQnA);

// PATCH /api/submissions/:id
router.patch("/:id", zValidate(updateSubmissionQnASchema), updateSubmissionQnA);

export default router;
