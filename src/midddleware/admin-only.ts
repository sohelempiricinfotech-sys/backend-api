import { Request, Response, NextFunction } from "express";
import { SystemRole } from "../module/users/user.model";

/**
 * Middleware that restricts access to SUPER_ADMIN and ORG_ADMIN users only.
 * Must be used AFTER authMiddleware (requires req.loginUser to be set).
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const { systemRole } = req.loginUser.user;

  if (
    systemRole === SystemRole.SUPER_ADMIN ||
    systemRole === SystemRole.ORG_ADMIN
  ) {
    return next();
  }

  return res.status(403).json({ message: "Admin access required" });
};
