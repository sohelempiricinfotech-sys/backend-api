export interface DashboardStatsParams {
  org_id: number;
  user_ids?: number[];
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

export interface DashboardStatsResponse {
  candidates_added: number;
  submissions_added: number;
  submissions_applied: number;
  submissions_interview: number;
  submissions_joined: number;
}

export interface DashboardChartParams {
  org_id: number;
  user_ids?: number[];
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

export interface DailyCandidate {
  date: string;
  count: number;
}

export interface DailySubmissionStatus {
  date: string;
  applied: number;
  interview: number;
  joined: number;
  rejected: number;
}

export interface DashboardChartResponse {
  candidates: DailyCandidate[];
  submissions: DailySubmissionStatus[];
}

// ---------- Candidates by state ----------

export interface CandidatesByStateParams {
  org_id: number;
  country: string;
  user_ids?: number[];
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

export interface StateCandidateCount {
  state: string;
  count: number;
}
