export type JobPostSkillType = {
  org_id: number;

  job_post_id: string;
  skill_id: number;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
};

export type CreateJobPostSkillInput = Omit<
  JobPostSkillType,
  "created_at" | "updated_at"
>;

export type UpdateJobPostSkillInput = Partial<JobPostSkillType>;
