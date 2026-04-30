import { Request } from "express";
import { IsNull } from "typeorm";
import { AppDataSource } from "../data-source";
import { JobPost } from "../module/job/job.model";
import { Project } from "../module/projects/projects.model";
import { SystemRole } from "../module/users/user.model";

/**
 * Returns true if the logged-in user is allowed to act on the given job.
 *
 * Access rules (any one is sufficient):
 *  1. System role is SUPER_ADMIN or ORG_ADMIN
 *  2. User is the job's owner (job.owner_user_id === user.id)
 *  3. User is in job.assignee_ids
 *  4. The job belongs to a project and user is in project.assignee_ids
 */
export const canUserAccessJob = async (
  req: Request,
  org_id: number,
  job_id: string
): Promise<boolean> => {
  const { id: user_id, systemRole } = req.loginUser.user;

  // 1. Admin shortcut
  if (
    systemRole === SystemRole.SUPER_ADMIN ||
    systemRole === SystemRole.ORG_ADMIN
  ) {
    return true;
  }

  // 2. Fetch the job (scoped to org_id)
  const job = await AppDataSource.getRepository(JobPost).findOne({
    where: { id: job_id, org_id, deleted_at: IsNull() },
    select: ["id", "owner_user_id", "assignee_ids", "project_id"],
  });

  if (!job) {
    return false;
  }

  // 3. Owner check
  if (job.owner_user_id === user_id) {
    return true;
  }

  // 4. Job assignees
  if (job.assignee_ids?.includes(user_id)) {
    return true;
  }

  // 5. Project assignees
  if (job.project_id) {
    const project = await AppDataSource.getRepository(Project).findOne({
      where: { id: job.project_id, org_id, deleted_at: IsNull() },
      select: ["id", "assignee_ids"],
    });

    if (project?.assignee_ids?.includes(user_id)) {
      return true;
    }
  }

  return false;
};
