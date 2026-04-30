import { Request, Response } from "express";
import {
  getDashboardStats,
  getDashboardChart,
  getCandidatesByState,
} from "./dashboard.services";

const ADMIN_ROLES = ["super_admin", "org_admin"];

/**
 * Non-admin users are forced to their own user id,
 * ignoring whatever user_ids they send in the body.
 */
function resolveUserIds(req: Request, bodyUserIds?: number[]): number[] | undefined {
  const { id: user_id, systemRole } = req.loginUser.user;

  if (ADMIN_ROLES.includes(systemRole)) {
    return bodyUserIds?.length ? bodyUserIds : undefined;
  }

  // Non-admin → always scoped to own id
  return [user_id];
}

export async function getDashboardStatsHandler(req: Request, res: Response) {
  try {
    const { org_id } = req.loginUser.user;
    const { user_ids, start_date, end_date } = req.body;

    const data = await getDashboardStats({
      org_id,
      user_ids: resolveUserIds(req, user_ids),
      start_date,
      end_date,
    });

    return res.status(200).json({ message: "Dashboard stats fetched successfully", data });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

export async function getDashboardChartHandler(req: Request, res: Response) {
  try {
    const { org_id } = req.loginUser.user;
    const { user_ids, start_date, end_date } = req.body;

    const data = await getDashboardChart({
      org_id,
      user_ids: resolveUserIds(req, user_ids),
      start_date,
      end_date,
    });

    return res.status(200).json({ message: "Dashboard chart data fetched successfully", data });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

export async function getCandidatesByStateHandler(req: Request, res: Response) {
  try {
    const { org_id } = req.loginUser.user;
    const { country, user_ids, start_date, end_date } = req.body;

    const data = await getCandidatesByState({
      org_id,
      country,
      user_ids: resolveUserIds(req, user_ids),
      start_date,
      end_date,
    });

    return res.status(200).json({ message: "Candidates by state fetched successfully", data });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
