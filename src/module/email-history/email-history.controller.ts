import { Request, Response } from "express";
import {
  getCandidateEmailHistory,
  getSubmissionEmailHistory,
} from "./email-history.services";
import { getProfilePhotoSignedUrl } from "../../utility/s3";

/**
 * Attach sender profile photo signed URLs to history records.
 * Deduplicates sender IDs to avoid redundant S3 calls.
 */
async function attachSenderPhotos<T extends { sender_id: number }>(
  records: T[]
): Promise<(T & { sender_profile_photo_url: string | null })[]> {
  const uniqueSenderIds = [...new Set(records.map((r) => r.sender_id))];
  const photoMap = new Map<number, string | null>();

  await Promise.all(
    uniqueSenderIds.map(async (senderId) => {
      try {
        const url = await getProfilePhotoSignedUrl(senderId);
        photoMap.set(senderId, url);
      } catch {
        photoMap.set(senderId, null);
      }
    })
  );

  return records.map((r) => ({
    ...r,
    sender_profile_photo_url: photoMap.get(r.sender_id) ?? null,
  }));
}

export const getCandidateEmailHistoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const { org_id } = req.loginUser.user;
    const userId = Number(req.params.userId);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Valid userId is required" });
    }

    const history = await getCandidateEmailHistory(userId, org_id);
    const historyWithPhotos = await attachSenderPhotos(history);

    return res.status(200).json({
      message: "Candidate email history fetched successfully",
      data: historyWithPhotos,
    });
  } catch (error: any) {
    console.error("Error fetching candidate email history:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

export const getSubmissionEmailHistoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const { org_id } = req.loginUser.user;
    const submissionId = Number(req.params.submissionId);

    if (!submissionId || isNaN(submissionId)) {
      return res
        .status(400)
        .json({ message: "Valid submissionId is required" });
    }

    const history = await getSubmissionEmailHistory(submissionId, org_id);
    const historyWithPhotos = await attachSenderPhotos(history);

    return res.status(200).json({
      message: "Submission email history fetched successfully",
      data: historyWithPhotos,
    });
  } catch (error: any) {
    console.error("Error fetching submission email history:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
