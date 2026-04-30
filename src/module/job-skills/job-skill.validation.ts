import { z } from "zod";

export const createJobPostSkillSchema = z.object({
  job_post_id: z.number().positive("Job Post ID must be a positive number"),
  skill_id: z.number().positive("Skill ID must be a positive number"),
});

export const updateJobPostSkillSchema = z.object({
  job_post_id: z.number().optional(),
  skill_id: z.number().optional(),
});
