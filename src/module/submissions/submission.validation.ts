import { z } from "zod";

export const bulkSubmitSchema = z.object({
  job_id: z.string().uuid("Invalid job ID"),
  user_ids: z.array(z.number().int().positive()).min(1, "At least one candidate is required"),
});

export const bulkSubmitAllSchema = z.object({
  job_id: z.string().uuid("Invalid job ID"),
  filters: z.object({
    search: z.string().optional(),
    gender: z.string().optional(),
    industry_id: z.number().int().optional(),
    skill_ids: z.array(z.number().int()).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    status: z.string().optional(),
    experience_years_min: z.number().optional(),
    experience_years_max: z.number().optional(),
    notice_period_min: z.number().int().optional(),
    notice_period_max: z.number().int().optional(),
    unique_id: z.string().optional(),
    created_by_id: z.number().int().optional(),
    updated_by_id: z.number().int().optional(),
    last_activity_min: z.string().optional(),
  }).optional(),
});

export const updateSubmissionQnASchema = z.object({
  questions_answers: z.record(z.string(), z.any()).optional(),
  expected_ctc: z.string().optional().nullable(),
});

export const bulkUpdateSubmissionStatusSchema = z.object({
  submission_ids: z.array(z.number().int().positive()).min(1, "At least one submission is required"),
  status_id: z.number().int().positive("Invalid status ID"),
  job_id: z.string().uuid("Invalid job ID"),
});

export const bulkUpdateAllSubmissionStatusSchema = z.object({
  job_id: z.string().uuid("Invalid job ID"),
  status_id: z.number().int().positive("Invalid status ID"),
  filters: z.object({
    search: z.string().optional(),
    status_id: z.number().int().optional(),
    gender: z.string().optional(),
    industry_id: z.number().int().optional(),
    source_id: z.number().int().optional(),
    skill_ids: z.array(z.number().int()).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    recruiter_user_id: z.number().int().optional(),
    created_by_id: z.number().int().optional(),
    unique_submission_id: z.string().optional(),
    experience_years_min: z.number().optional(),
    experience_years_max: z.number().optional(),
    expected_ctc_min: z.number().optional(),
    expected_ctc_max: z.number().optional(),
  }).optional(),
});

export const copySubmissionsToJobSchema = z.object({
  submission_ids: z.array(z.number().int().positive()).min(1, "At least one submission is required"),
  job_id: z.string().uuid("Invalid job ID"),
});

export const copyAllSubmissionsToJobSchema = z.object({
  source_job_id: z.string().uuid("Invalid source job ID"),
  target_job_id: z.string().uuid("Invalid target job ID"),
  filters: z.object({
    search: z.string().optional(),
    status_id: z.number().int().optional(),
    gender: z.string().optional(),
    industry_id: z.number().int().optional(),
    source_id: z.number().int().optional(),
    skill_ids: z.array(z.number().int()).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    recruiter_user_id: z.number().int().optional(),
    created_by_id: z.number().int().optional(),
    unique_submission_id: z.string().optional(),
    experience_years_min: z.number().optional(),
    experience_years_max: z.number().optional(),
    expected_ctc_min: z.number().optional(),
    expected_ctc_max: z.number().optional(),
  }).optional(),
});

export const sendEmailBySubmissionIdsSchema = z.object({
  submission_ids: z.array(z.number().int().positive()).min(1, "At least one submission is required"),
  job_id: z.string().uuid("Invalid job ID"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  reply_to: z.string().email("Invalid reply-to email").optional(),
  link_name: z.string().optional(),
  link_url: z.string().url("Invalid link URL").optional(),
});

export const sendEmailAllSubmissionsSchema = z.object({
  job_id: z.string().uuid("Invalid job ID"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  reply_to: z.string().email("Invalid reply-to email").optional(),
  link_name: z.string().optional(),
  link_url: z.string().url("Invalid link URL").optional(),
  filters: z.object({
    search: z.string().optional(),
    status_id: z.number().int().optional(),
    gender: z.string().optional(),
    industry_id: z.number().int().optional(),
    source_id: z.number().int().optional(),
    skill_ids: z.array(z.number().int()).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    recruiter_user_id: z.number().int().optional(),
    created_by_id: z.number().int().optional(),
    unique_submission_id: z.string().optional(),
    experience_years_min: z.number().optional(),
    experience_years_max: z.number().optional(),
    expected_ctc_min: z.number().optional(),
    expected_ctc_max: z.number().optional(),
  }).optional(),
});

export const portalApplyJobSchema = z.object({
  job_id: z.string().uuid("Invalid job ID"),
  resume_id: z.number().int().positive("Resume ID is required"),
  questions_answers: z.record(z.string(), z.any()).optional(),
  expected_ctc: z.string().optional(),
  notice_period: z.number().int().optional(),
  availability: z.string().optional(),
  utm_source: z.string().optional(),
  utm_cin: z.string().uuid("Invalid recruiter identifier").optional(),
});
