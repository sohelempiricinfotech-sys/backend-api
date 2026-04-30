import { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { IsNull } from "typeorm";
import * as submissionService from "../../module/submissions/submission.services";
import * as submissionStatusService from "../../module/submission-statuses/submission-status.services";
import { getSourceByName } from "../../module/sources/source.services";
import { getUser } from "../../module/users/user.services";
import { AppDataSource } from "../../data-source";
import { Resume } from "../../module/resumes/resume.model";
import { JobPost } from "../../module/job/job.model";
import { uploadFileToS3, getFileUrl } from "../../utility/s3";
import { addSubmissionIndex, removeSubmissionIndex } from "../../elastic-index/submission/submission.operation";
import { StatusType } from "../../module/submission-statuses/submission-status.model";
import { adjustStatusCounts } from "../../module/submission-statuses/submission-status.services";
import { updateJobApplicantCounts } from "../../elastic-index/job/job.operation";

const resumeRepository = AppDataSource.getRepository(Resume);
const jobRepository = AppDataSource.getRepository(JobPost);

/**
 * POST /api/portal/submissions
 * Apply to a job from the career portal.
 */
export const applyToJob = async (req: Request, res: Response) => {
  try {
    const { id: userId, org_id } = req.portalUser;
    const {
      job_id,
      resume_id,
      questions_answers,
      expected_ctc,
      notice_period,
      availability,
      utm_source,
      utm_cin,
    } = req.body;

    // Check job exists and is Active
    const job = await jobRepository.findOneBy({
      id: job_id,
      org_id,
      deleted_at: IsNull(),
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "Active") {
      return res.status(400).json({ message: "This job is no longer accepting applications" });
    }

    // Check if candidate already has a submission for this job
    const existingSubmission = await submissionService.getSubmissionByUserAndJob(
      userId,
      job_id,
      org_id
    );

    let replacedStatusId: number | null = null;

    if (existingSubmission) {
      // Look up the current status to check its stage
      const currentStatus = existingSubmission.submission_status_id
        ? await submissionStatusService.getSubmissionStatus({
            id: existingSubmission.submission_status_id,
            org_id,
          })
        : null;

      if (currentStatus?.status_type === StatusType.LONGLIST) {
        replacedStatusId = currentStatus.id;
        // Candidate was in longlist (bulk-submitted by recruiter) — remove old submission
        await submissionService.submissionRepository.delete({
          id: existingSubmission.id,
          org_id,
        });
        await removeSubmissionIndex(existingSubmission.id);
      } else {
        return res.status(400).json({ message: "You have already applied to this job" });
      }
    }

    // Get application status for this job
    const applicationStatus = await submissionStatusService.getApplicationStatusByJobId(job_id, org_id);

    if (!applicationStatus) {
      return res.status(500).json({ message: "Job configuration error: no application status found" });
    }

    // Verify resume belongs to this user
    const resume = await resumeRepository.findOneBy({
      id: resume_id,
      user_id: userId,
      org_id,
      deleted_at: IsNull(),
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Resolve utm_source to source_id (case-insensitive)
    let source_id: number | null = null;
    if (utm_source) {
      const sourceRecord = await getSourceByName(utm_source, org_id);
      if (sourceRecord) {
        source_id = sourceRecord.id;
      }
    }

    // Resolve utm_cin (recruiter UUID) to recruiter_user_id, fallback to job owner
    let recruiter_user_id: number | null = null;
    if (utm_cin) {
      const recruiterUser = await getUser({ uuid_id: utm_cin, org_id });
      if (recruiterUser) {
        recruiter_user_id = recruiterUser.id;
      }
    }
    if (!recruiter_user_id && job.owner_user_id) {
      recruiter_user_id = job.owner_user_id;
    }

    // Generate unique submission ID based on candidate ID
    const submissionCount = await submissionService.submissionRepository.count({
      where: { org_id },
    });
    const uniqueSubmissionId = `SUB-${userId}-${String(submissionCount + 1).padStart(4, "0")}`;

    // Create submission
    const submission = await submissionService.createSubmission({
      org_id,
      user_id: userId,
      job_id,
      submission_status_id: applicationStatus.id,
      recruiter_user_id,
      source_id,
      unique_submission_id: uniqueSubmissionId,
      questions_answers: questions_answers || null,
      expected_ctc: expected_ctc || null,
      offer_ctc: null,
      notice_period: notice_period || null,
      availability: availability || null,
      resume_id: resume.id,
      resume_path: resume.file_path,
      submission_date_at: new Date().toISOString(),
      updated_date: null,
      created_by: userId,
      updated_by: null,
      deleted_by: null,
    });

    // Adjust status counts
    const statusCountMap: Record<number, number> = { [applicationStatus.id]: 1 };
    if (replacedStatusId) {
      statusCountMap[replacedStatusId] = (statusCountMap[replacedStatusId] ?? 0) - 1;
    }
    await adjustStatusCounts(statusCountMap, org_id);
    updateJobApplicantCounts(job_id, org_id);

    // index to submission index
    await addSubmissionIndex(submission.id, submission.org_id);

    return res.status(201).json({
      message: "Application submitted successfully",
      data: {
        id: submission.id,
        unique_submission_id: submission.unique_submission_id,
      },
    });
  } catch (error: any) {
    console.error("Error applying to job:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// --- Multer for question file uploads ---
export const questionFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * POST /api/portal/submissions/upload-file
 * Upload a file for a file-type screening question.
 */
export const uploadQuestionFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const originalName = req.file.originalname;
    const s3Key = `submissions/questions/${uuidv4()}-${originalName}`;

    await uploadFileToS3(req.file.buffer, s3Key, req.file.mimetype);

    const fileUrl = await getFileUrl(s3Key);

    return res.status(200).json({
      message: "File uploaded successfully",
      data: {
        file_name: originalName,
        file_path: s3Key,
        file_url: fileUrl,
      },
    });
  } catch (error: any) {
    console.error("Error uploading question file:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
