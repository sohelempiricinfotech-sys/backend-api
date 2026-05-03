import { AppDataSource } from "../../data-source";
import { Submission } from "../submissions/submission.model";
import { SubmissionStatus } from "../submission-statuses/submission-status.model";
import { CandidateData } from "../candidate-data/candidate-data.model";
import { UserMetadata } from "../user-metadata/user-metadata.model";
import {
  DashboardStatsParams,
  DashboardStatsResponse,
  DashboardChartParams,
  DashboardChartResponse,
  CandidatesByStateParams,
  StateCandidateCount,
} from "./dashboard.type";

/**
 * Single function for both global and user-specific dashboard stats.
 *
 * - If `user_ids` is omitted / empty  → global stats for the whole org.
 * - If `user_ids` is provided         → stats scoped to those recruiters / creators.
 * - Multiple user_ids produce a combined (summed) result.
 *
 * Date range is inclusive: [start_date 00:00:00, end_date 23:59:59.999].
 *
 * NOTE: Because the schema has no status-change history table, status-based
 * counts (applied / interview / joined) use `submissions.updated_at` as a
 * proxy for when the status was last set.  This is an approximation — any
 * field update on the submission row bumps `updated_at`.
 */
export async function getDashboardStats(
  params: DashboardStatsParams
): Promise<DashboardStatsResponse> {
  const { org_id, user_ids, start_date, end_date } = params;

  const rangeStart = `${start_date} 00:00:00`;
  const rangeEnd = `${end_date} 23:59:59.999`;
  const aggregationRange = { rangeStart, rangeEnd };

  const hasUserFilter =
    Array.isArray(user_ids) && user_ids.length > 0;

  // ---------- 1. Candidates added ----------
  const candidateQb = AppDataSource.getRepository(CandidateData)
    .createQueryBuilder("cd")
    .where("cd.org_id = :org_id", { org_id })
    .andWhere("cd.deleted_at IS NULL")
    .andWhere("cd.created_at BETWEEN :rangeStart AND :rangeEnd", aggregationRange);

  if (hasUserFilter) {
    candidateQb.andWhere("cd.created_by IN (:...user_ids)", { user_ids });
  }

  const candidatesAdded = await candidateQb.getCount();

  // ---------- 2. Submissions added ----------
  const submissionsAddedQb = AppDataSource.getRepository(Submission)
    .createQueryBuilder("s")
    .where("s.org_id = :org_id", { org_id })
    .andWhere("s.deleted_at IS NULL")
    .andWhere("s.created_at BETWEEN :rangeStart AND :rangeEnd", aggregationRange);

  if (hasUserFilter) {
    submissionsAddedQb.andWhere("s.recruiter_user_id IN (:...user_ids)", {
      user_ids,
    });
  }

  const submissionsAdded = await submissionsAddedQb.getCount();

  // ---------- 3. Status-based counts (applied / interview / joined) ----------
  // Single query with conditional aggregation to minimise DB round-trips.
  const statusQb = AppDataSource.getRepository(Submission)
    .createQueryBuilder("s")
    .innerJoin(
      SubmissionStatus,
      "ss",
      "ss.id = s.submission_status_id AND ss.org_id = s.org_id"
    )
    .where("s.org_id = :org_id", { org_id })
    .andWhere("s.deleted_at IS NULL")
    .andWhere("ss.deleted_at IS NULL")
    .andWhere("s.updated_at BETWEEN :rangeStart AND :rangeEnd", aggregationRange)
    .select(
      "COUNT(CASE WHEN ss.status_type = 'application' THEN 1 END)",
      "applied_count"
    )
    .addSelect(
      "COUNT(CASE WHEN ss.status_type = 'interview' THEN 1 END)",
      "interview_count"
    )
    .addSelect(
      "COUNT(CASE WHEN ss.status_type = 'joined' THEN 1 END)",
      "joined_count"
    );

  if (hasUserFilter) {
    statusQb.andWhere("s.recruiter_user_id IN (:...user_ids)", { user_ids });
  }

  const statusCounts = await statusQb.getRawOne();

  return {
    candidates_added: candidatesAdded,
    submissions_added: submissionsAdded,
    submissions_applied: Number(statusCounts?.applied_count ?? 0),
    submissions_interview: Number(statusCounts?.interview_count ?? 0),
    submissions_joined: Number(statusCounts?.joined_count ?? 0),
  };
}

/**
 * Daily breakdown for charts.
 *
 * Returns two arrays covering the last N days:
 *   - candidates: daily count of candidates added
 *   - submissions: daily count per status type (applied, interview, joined, rejected)
 */
export async function getDashboardChart(
  params: DashboardChartParams
): Promise<DashboardChartResponse> {
  const { org_id, user_ids, start_date, end_date } = params;

  const from = new Date(start_date);
  const to = new Date(end_date);

  const rangeStart = `${start_date} 00:00:00`;
  const rangeEnd = `${end_date} 23:59:59.999`;

  const hasUserFilter = Array.isArray(user_ids) && user_ids.length > 0;

  // ---------- 1. Daily candidates ----------
  const candidateQb = AppDataSource.getRepository(CandidateData)
    .createQueryBuilder("cd")
    .select("DATE(cd.created_at)", "date")
    .addSelect("COUNT(cd.id)", "count")
    .where("cd.org_id = :org_id", { org_id })
    .andWhere("cd.deleted_at IS NULL")
    .andWhere("cd.created_at BETWEEN :rangeStart AND :rangeEnd", {
      rangeStart,
      rangeEnd,
    })
    .groupBy("DATE(cd.created_at)")
    .orderBy("DATE(cd.created_at)", "ASC");

  if (hasUserFilter) {
    candidateQb.andWhere("cd.created_by IN (:...user_ids)", { user_ids });
  }

  const candidateRows: { date: string | Date; count: string }[] =
    await candidateQb.getRawMany();

  // ---------- 2. Daily submission status counts ----------
  const statusQb = AppDataSource.getRepository(Submission)
    .createQueryBuilder("s")
    .innerJoin(
      SubmissionStatus,
      "ss",
      "ss.id = s.submission_status_id AND ss.org_id = s.org_id"
    )
    .select("DATE(s.updated_at)", "date")
    .addSelect(
      "COUNT(CASE WHEN ss.status_type = 'application' THEN 1 END)",
      "applied"
    )
    .addSelect(
      "COUNT(CASE WHEN ss.status_type = 'interview' THEN 1 END)",
      "interview"
    )
    .addSelect(
      "COUNT(CASE WHEN ss.status_type = 'joined' THEN 1 END)",
      "joined"
    )
    .addSelect(
      "COUNT(CASE WHEN ss.status_type = 'rejected' THEN 1 END)",
      "rejected"
    )
    .where("s.org_id = :org_id", { org_id })
    .andWhere("s.deleted_at IS NULL")
    .andWhere("ss.deleted_at IS NULL")
    .andWhere("s.updated_at BETWEEN :rangeStart AND :rangeEnd", {
      rangeStart,
      rangeEnd,
    })
    .groupBy("DATE(s.updated_at)")
    .orderBy("DATE(s.updated_at)", "ASC");

  if (hasUserFilter) {
    statusQb.andWhere("s.recruiter_user_id IN (:...user_ids)", { user_ids });
  }

  const statusRows: {
    date: string | Date;
    applied: string;
    interview: string;
    joined: string;
    rejected: string;
  }[] = await statusQb.getRawMany();

  // ---------- Build full date series (fill gaps with 0) ----------
  // PG DATE() returns a JS Date object, so convert to ISO string first
  const toDateKey = (d: string | Date) =>
    d instanceof Date ? d.toLocaleDateString().slice(0, 10) : String(d).slice(0, 10);

  const candidateMap = new Map(
    candidateRows.map((r) => [toDateKey(r.date), Number(r.count)])
  );
  const statusMap = new Map(
    statusRows.map((r) => [
      toDateKey(r.date),
      {
        applied: Number(r.applied),
        interview: Number(r.interview),
        joined: Number(r.joined),
        rejected: Number(r.rejected),
      },
    ])
  );

  const candidates = [];
  const submissions = [];

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const key = d.toLocaleDateString().slice(0, 10);
    candidates.push({ date: key, count: candidateMap.get(key) ?? 0 });
    const s = statusMap.get(key);
    submissions.push({
      date: key,
      applied: s?.applied ?? 0,
      interview: s?.interview ?? 0,
      joined: s?.joined ?? 0,
      rejected: s?.rejected ?? 0,
    });
  }

  return { candidates, submissions };
}

/**
 * Candidate count grouped by state for a given country + date range.
 *
 * Joins candidate_data → user_metadata on (user_id, org_id)
 * to get the candidate's state from their metadata.
 */
export async function getCandidatesByState(
  params: CandidatesByStateParams
): Promise<StateCandidateCount[]> {
  const { org_id, country, user_ids, start_date, end_date } = params;

  const rangeStart = `${start_date} 00:00:00`;
  const rangeEnd = `${end_date} 23:59:59.999`;

  const hasUserFilter = Array.isArray(user_ids) && user_ids.length > 0;

  const qb = AppDataSource.getRepository(CandidateData)
    .createQueryBuilder("cd")
    .innerJoin(
      UserMetadata,
      "um",
      "um.user_id = cd.user_id AND um.org_id = cd.org_id"
    )
    .select("CASE WHEN um.state IS NULL OR um.state = '' THEN 'Not Mentioned' ELSE um.state END", "state")
    .addSelect("COUNT(cd.id)", "count")
    .where("cd.org_id = :org_id", { org_id })
    .andWhere("cd.deleted_at IS NULL")
    .andWhere("um.deleted_at IS NULL")
    .andWhere("um.country = :country", { country })
    .andWhere("cd.created_at BETWEEN :rangeStart AND :rangeEnd", {
      rangeStart,
      rangeEnd,
    })
    .groupBy("CASE WHEN um.state IS NULL OR um.state = '' THEN 'Not Mentioned' ELSE um.state END")
    .orderBy("count", "DESC");

  if (hasUserFilter) {
    qb.andWhere("cd.created_by IN (:...user_ids)", { user_ids });
  }

  const rows: { state: string; count: string }[] = await qb.getRawMany();

  return rows.map((r) => ({
    state: r.state,
    count: Number(r.count),
  }));
}
