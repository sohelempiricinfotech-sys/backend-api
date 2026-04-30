import { Request, Response } from "express";
import * as submissionService from "./submission.services";
import { addSubmissionIndex } from "../../elastic-index/submission/submission.operation";
import { sendEmailBySubmissionIds } from "../../utility/send-candidate-email";
import { searchSubmissions, SubmissionFilterOptions } from "../../elastic-index/submission/submission.get";
import { canUserAccessJob } from "../../utility/check-job-access";

const NO_JOB_ACCESS_MESSAGE = "You don't have permission for this job";

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;
    const {
      job_id,
      status_id,
      search_after,
      limit = 13,
      format,
      search,
      gender,
      industryId,
      sourceId,
      skillIds,
      minExperience,
      maxExperience,
      minExpectedCtc,
      maxExpectedCtc,
      city,
      state,
      country,
      recruiterId,
      createdById,
      uniqueSubmissionId,
      sort_by,
      sort_order,
    } = req.query;

    if (!job_id) {
      return res.status(400).json({ message: "job_id is required" });
    }

    const parsedSkillIds = skillIds
      ? (skillIds as string).split(",").map(Number).filter((n) => !isNaN(n))
      : undefined;

    const parsedSearchAfter = search_after
      ? (search_after as string).split(",").map((v) => {
          const num = Number(v);
          return isNaN(num) ? v : num;
        })
      : undefined;

    const filterOptions = {
      jobId: job_id as string,
      statusId: status_id ? Number(status_id) : undefined,
      search: search ? String(search) : undefined,
      gender: gender ? String(gender) : undefined,
      industryId: industryId ? Number(industryId) : undefined,
      sourceId: sourceId ? Number(sourceId) : undefined,
      skillIds: parsedSkillIds,
      minExperience: minExperience !== undefined ? Number(minExperience) : undefined,
      maxExperience: maxExperience !== undefined ? Number(maxExperience) : undefined,
      minExpectedCtc: minExpectedCtc !== undefined ? Number(minExpectedCtc) : undefined,
      maxExpectedCtc: maxExpectedCtc !== undefined ? Number(maxExpectedCtc) : undefined,
      city: city ? String(city) : undefined,
      state: state ? String(state) : undefined,
      country: country ? String(country) : undefined,
      recruiterId: recruiterId ? Number(recruiterId) : undefined,
      createdById: createdById ? Number(createdById) : undefined,
      uniqueSubmissionId: uniqueSubmissionId ? String(uniqueSubmissionId) : undefined,
    };

    // CSV export — streams all matching records using active filters
    if (format === "csv") {
      const csv = await submissionService.getSubmissionsCsvFromES(org_id, filterOptions);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="submissions-${job_id}.csv"`);
      return res.send(csv);
    }

    const result = await submissionService.getSubmissionsListFromES(org_id, {
      ...filterOptions,
      search_after: parsedSearchAfter,
      limit: Number(limit),
      sort_by: sort_by as string | undefined,
      sort_order: (sort_order === "asc" || sort_order === "desc") ? sort_order : undefined,
    });

    return res.status(200).json({
      message: "Submissions fetched successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const bulkSubmitCandidates = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { job_id, user_ids } = req.body;

    const hasAccess = await canUserAccessJob(req, org_id, job_id);
    if (!hasAccess) {
      return res.status(403).json({ message: NO_JOB_ACCESS_MESSAGE });
    }

    const result = await submissionService.bulkSubmitCandidates(
      org_id,
      job_id,
      user_ids,
      user_id
    );

    return res.status(200).json({
      message: "Candidates submitted successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error bulk submitting candidates:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const bulkSubmitAllCandidates = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { job_id, filters } = req.body;

    const hasAccess = await canUserAccessJob(req, org_id, job_id);
    if (!hasAccess) {
      return res.status(403).json({ message: NO_JOB_ACCESS_MESSAGE });
    }

    const result = await submissionService.bulkSubmitAllCandidates(
      org_id,
      job_id,
      user_id,
      filters
    );

    return res.status(200).json({
      message: "All matching candidates submitted successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error bulk submitting all candidates:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const getSubmissionQnA = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;
    const submissionId = Number(req.params.id);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ message: "Valid submission ID is required" });
    }

    const submission = await submissionService.getSubmissionById(submissionId, org_id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const qnaResponse = await submissionService.getSubmissionQnA(submissionId, org_id);

    return res.status(200).json({
      message: "Submission Q&A fetched successfully",
      data: qnaResponse,
    });
  } catch (error: any) {
    console.error("Error fetching submission Q&A:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const getSubmissionResume = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;
    const submissionId = Number(req.params.id);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ message: "Valid submission ID is required" });
    }

    const result = await submissionService.getSubmissionResumeUrl(submissionId, org_id);

    return res.status(200).json({
      message: result ? "Resume URL fetched successfully" : "No resume found",
      data: result,
    });
  } catch (error: any) {
    console.error("Error fetching submission resume:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const bulkUpdateSubmissionStatusHandler = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { submission_ids, status_id, job_id } = req.body;

    const hasAccess = await canUserAccessJob(req, org_id, job_id);
    if (!hasAccess) {
      return res.status(403).json({ message: NO_JOB_ACCESS_MESSAGE });
    }

    const result = await submissionService.bulkUpdateSubmissionStatusService(
      org_id,
      submission_ids,
      status_id,
      job_id,
      user_id
    );

    return res.status(200).json({
      message: "Submissions updated successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.message === "Invalid status: status does not belong to this job") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error bulk updating submission status:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const copySubmissionsToJobHandler = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { submission_ids, job_id } = req.body;

    // Gate only on the TARGET job — copying out of a job you can read is fine.
    const hasAccess = await canUserAccessJob(req, org_id, job_id);
    if (!hasAccess) {
      return res.status(403).json({ message: NO_JOB_ACCESS_MESSAGE });
    }

    const result = await submissionService.copySubmissionsToJob(
      org_id,
      submission_ids,
      job_id,
      user_id
    );

    return res.status(200).json({
      message: "Submissions copied successfully",
      data: result,
    });
  } catch (error: any) {
    if (
      error.message === "No valid submissions found" ||
      error.message === "Target job configuration error: no default status found"
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error copying submissions to job:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const copyAllSubmissionsToJobHandler = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { source_job_id, target_job_id, filters } = req.body;

    // Gate only on the TARGET job — copying out of a job you can read is fine.
    const hasAccess = await canUserAccessJob(req, org_id, target_job_id);
    if (!hasAccess) {
      return res.status(403).json({ message: NO_JOB_ACCESS_MESSAGE });
    }

    const result = await submissionService.copyAllSubmissionsToJob(
      org_id,
      source_job_id,
      target_job_id,
      user_id,
      filters
    );

    return res.status(200).json({
      message: "All matching submissions copied successfully",
      data: result,
    });
  } catch (error: any) {
    if (
      error.message === "No valid submissions found" ||
      error.message === "Target job configuration error: no default status found"
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error copying all submissions to job:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const bulkUpdateAllSubmissionStatusHandler = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { job_id, status_id, filters } = req.body;

    const hasAccess = await canUserAccessJob(req, org_id, job_id);
    if (!hasAccess) {
      return res.status(403).json({ message: NO_JOB_ACCESS_MESSAGE });
    }

    const result = await submissionService.bulkUpdateAllSubmissionStatusService(
      org_id,
      job_id,
      status_id,
      user_id,
      filters
    );

    return res.status(200).json({
      message: "All matching submissions updated successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.message === "Invalid status: status does not belong to this job") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error bulk updating all submission statuses:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const markSubmissionReadHandler = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;
    const submissionId = Number(req.params.id);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ message: "Valid submission ID is required" });
    }

    const result = await submissionService.markSubmissionRead(submissionId, org_id);

    if (!result) {
      return res.status(404).json({ message: "Submission not found" });
    }

    return res.status(200).json({
      message: "Submission marked as read",
      data: result,
    });
  } catch (error: any) {
    console.error("Error marking submission as read:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const markSubmissionUnreadHandler = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;
    const submissionId = Number(req.params.id);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ message: "Valid submission ID is required" });
    }

    const result = await submissionService.markSubmissionUnread(submissionId, org_id);

    if (!result) {
      return res.status(404).json({ message: "Submission not found" });
    }

    return res.status(200).json({
      message: "Submission marked as unread",
      data: result,
    });
  } catch (error: any) {
    console.error("Error marking submission as unread:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const updateSubmissionQnA = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const submissionId = Number(req.params.id);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ message: "Valid submission ID is required" });
    }

    const submission = await submissionService.getSubmissionById(submissionId, org_id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.job_id) {
      const hasAccess = await canUserAccessJob(req, org_id, submission.job_id);
      if (!hasAccess) {
        return res.status(403).json({ message: NO_JOB_ACCESS_MESSAGE });
      }
    }

    const { questions_answers, expected_ctc } = req.body;

    const updated = await submissionService.updateSubmission(
      submissionId,
      org_id,
      user_id,
      { questions_answers, expected_ctc }
    );

    if (!updated) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // After updating the submission, update the corresponding document in Elasticsearch
    await addSubmissionIndex(updated.id, org_id);

    return res.status(200).json({
      message: "Submission updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating submission Q&A:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const sendEmailBySubmissionIdsHandler = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id, email } = req.loginUser.user;
    const { submission_ids, job_id, subject, body, reply_to, link_name, link_url } = req.body;

    const hasAccess = await canUserAccessJob(req, org_id, job_id);
    if (!hasAccess) {
      return res.status(403).json({ message: NO_JOB_ACCESS_MESSAGE });
    }

    const result = await sendEmailBySubmissionIds({
      submissionIds: submission_ids,
      jobId: job_id,
      userId: user_id,
      orgId: org_id,
      subject,
      body,
      replyTo: reply_to || email,
      linkName: link_name,
      linkUrl: link_url,
    });

    return res.status(200).json({
      message: "Emails queued successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.message.includes("No SMTP settings")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error sending email by submission IDs:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

const BATCH_SIZE = 500;

export const sendEmailAllSubmissionsHandler = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id, email } = req.loginUser.user;
    const { job_id, subject, body, reply_to, link_name, link_url, filters } = req.body;

    const hasAccess = await canUserAccessJob(req, org_id, job_id);
    if (!hasAccess) {
      return res.status(403).json({ message: NO_JOB_ACCESS_MESSAGE });
    }

    // Fetch all matching submission IDs from ES in batches
    const allIds: number[] = [];
    let hasMore = true;
    let searchAfter: (string | number)[] | undefined;

    while (hasMore) {
      const filterOptions: SubmissionFilterOptions = {
        org_id,
        job_id,
        idOnly: true,
        search_after: searchAfter,
        limit: BATCH_SIZE,
        search: filters?.search,
        status_id: filters?.status_id,
        gender: filters?.gender,
        industry_id: filters?.industry_id,
        source_id: filters?.source_id,
        skill_ids: filters?.skill_ids,
        city: filters?.city,
        state: filters?.state,
        country: filters?.country,
        recruiter_user_id: filters?.recruiter_user_id,
        created_by_id: filters?.created_by_id,
        unique_submission_id: filters?.unique_submission_id,
        experience_years_min: filters?.experience_years_min,
        experience_years_max: filters?.experience_years_max,
        expected_ctc_min: filters?.expected_ctc_min,
        expected_ctc_max: filters?.expected_ctc_max,
      };

      const result = await searchSubmissions(filterOptions);
      const esResult = result as { ids: string[]; total: number; hasMore: boolean; last_sort: (string | number)[] | null };

      const batchIds = esResult.ids.map(Number).filter((n) => !isNaN(n));
      allIds.push(...batchIds);

      hasMore = esResult.hasMore;
      searchAfter = esResult.last_sort ?? undefined;
    }

    if (allIds.length === 0) {
      return res.status(200).json({ message: "No matching submissions found", data: { total: 0 } });
    }

    await sendEmailBySubmissionIds({
      submissionIds: allIds,
      jobId: job_id,
      userId: user_id,
      orgId: org_id,
      subject,
      body,
      replyTo: reply_to || email,
      linkName: link_name,
      linkUrl: link_url,
    });

    return res.status(200).json({
      message: "Emails queued successfully",
      data: { total: allIds.length },
    });
  } catch (error: any) {
    if (error.message.includes("No SMTP settings")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error sending email to all submissions:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
