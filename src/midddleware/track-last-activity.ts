import { AppDataSource } from "../data-source";
import { User, SystemRole } from "../module/users/user.model";
import { updateCandidateLastActivity } from "../elastic-index/candidate/candidate.operation";

const userRepository = AppDataSource.getRepository(User);

/**
 * Updates last_activity for a user in DB. If the user is a candidate and the
 * previous last_activity date differs from today, also updates Elasticsearch.
 *
 * Runs async (fire-and-forget) so it never blocks the request.
 */
export function trackLastActivity(
  userId: number,
  orgId: number,
  systemRole: string,
  previousLastActivity: Date | null
): void {
  const now = new Date();

  // Fire-and-forget: update DB always
  userRepository
    .update({ id: userId, org_id: orgId }, { last_activity: now })
    .catch((err) => {
      console.error(`[LastActivity] DB update failed for user ${userId}:`, err);
    });

  // Only update ES for candidates, and only if the date actually changed
  if (systemRole === SystemRole.CANDIDATE) {
    const previousDate = previousLastActivity
      ? previousLastActivity.toISOString().slice(0, 10)
      : null;
    const currentDate = now.toISOString().slice(0, 10);

    if (previousDate !== currentDate) {
      updateCandidateLastActivity(orgId, userId, now.toISOString());
    }
  }
}
