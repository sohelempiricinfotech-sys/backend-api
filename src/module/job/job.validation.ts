import { z } from "zod";
import { questionInputSchema } from "../questions/question.validation";
import { JobStatus } from "./job.type";

export const createJobPostSchema = z.object({
  // org_id is extracted from JWT, not from request body
  team_leader_id: z.number().optional(),
  owner_user_id: z.number().optional(),
  industry_id: z.number().optional(),
  project_id: z.number({ required_error: "Project is required" }),
  branch_id: z.number().optional(),
  contact_person_id: z.number().optional(),
  assignee_ids: z.array(z.number()).optional(),
  interviewer_id: z.number().optional(),

  // ---------- JOB DETAILS ----------
  job_title: z.string().min(1, "Job title is required").optional(),
  job_description: z.string().optional(),
  unique_job_id: z.string().optional(),
  experience: z.string().optional(),
  question: z.string().optional(),
  number_of_positions: z.string().optional(),
  customer: z.string().optional(),
  target_date: z.coerce.date().optional(),
  description: z.string().optional(),

  // ---------- LOCATION DETAILS ----------
  job_address: z.string().optional(),
  pincode: z.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  remote_status: z.string().optional(),

  // ---------- JOB TYPE & PLACEMENT DETAILS ----------
  job_type: z.string().optional(),
  placement_type: z.string().optional(),
  min_ctc: z.number().optional(),
  max_ctc: z.number().optional(),
  onetime_placement_bill_type: z.string().optional(),
  onetime_placement_bill_value: z.string().optional(),

  // ---------- STATUS & VERIFICATION ----------
  is_verified: z.boolean().default(true).optional(),
  status: z.nativeEnum(JobStatus).default(JobStatus.ACTIVE).optional(),

  // ---------- CONTACT DETAILS ----------
  owner_phone: z.string().optional(),
  country_code: z.string().optional(),
  state_code: z.string().optional(),

  // ---------- SKILLS ----------
  skills: z.array(z.number()).optional(),

  // ---------- SCREENING QUESTIONS ----------
  questions: z.array(questionInputSchema).optional(),
});

export const updateJobPostSchema = z.object({
  team_leader_id: z.number().optional(),
  owner_user_id: z.number().optional(),
  industry_id: z.number().optional(),
  project_id: z.number().optional(),
  branch_id: z.number().optional(),
  contact_person_id: z.number().optional(),
  assignee_ids: z.array(z.number()).optional(),
  interviewer_id: z.number().optional(),
  job_title: z.string().optional(),
  job_description: z.string().optional(),
  unique_job_id: z.string().optional(),
  experience: z.string().optional(),
  question: z.string().optional(),
  number_of_positions: z.string().optional(),
  customer: z.string().optional(),
  target_date: z.coerce.date().optional(),
  description: z.string().optional(),
  job_address: z.string().optional(),
  pincode: z.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  remote_status: z.string().optional(),
  job_type: z.string().optional(),
  placement_type: z.string().optional(),
  min_ctc: z.number().optional(),
  max_ctc: z.number().optional(),
  onetime_placement_bill_type: z.string().optional(),
  onetime_placement_bill_value: z.string().optional(),
  is_verified: z.boolean().optional(),
  status: z.nativeEnum(JobStatus).optional(),
  owner_phone: z.string().optional(),
  country_code: z.string().optional(),
  state_code: z.string().optional(),
  skills: z.array(z.number()).optional(),

  // ---------- SCREENING QUESTIONS ----------
  questions: z.array(questionInputSchema).optional(),
});

export const toggleJobPublishedSchema = z.object({
  published: z.boolean({ required_error: "published is required" }),
});
