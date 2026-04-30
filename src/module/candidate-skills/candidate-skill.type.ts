export type CandidateSkillType = {
  org_id: number;

  user_id: number;
  skill_id: number;

  // ---------- TIMESTAMPS ----------
  created_at: Date | null;
  updated_at: Date | null;
};

export type CreateCandidateSkillInput = Omit<
  CandidateSkillType,
  "created_at" | "updated_at"
>;

export type UpdateCandidateSkillInput = Partial<CandidateSkillType>;
