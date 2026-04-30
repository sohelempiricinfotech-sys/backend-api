import { NextFunction, Request, Response } from "express";
import { decodeToken } from "../../helper/generateToken";
import { User, SystemRole } from "../../module/users/user.model";
import { AppDataSource } from "../../data-source";
import { IsNull } from "typeorm";
import { trackLastActivity } from "../../midddleware/track-last-activity";

const userRepository = AppDataSource.getRepository(User);

export type PortalUserType = {
  id: number;
  email: string;
  org_id: number;
  first_name: string | null;
  last_name: string | null;
};

export const portalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token is required." });
  }

  try {
    const decoded: any = await decodeToken(token);

    const user = await userRepository.findOneBy({
      id: decoded.sub,
      org_id: decoded.org_id,
      system_role: SystemRole.CANDIDATE,
      deleted_at: IsNull(),
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid token or user not found." });
    }

    if (user.access_token !== token) {
      return res.status(401).json({ message: "Token has been revoked." });
    }

    req.portalUser = {
      id: user.id,
      email: user.email,
      org_id: user.org_id,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    // Track last activity (fire-and-forget, never blocks the request)
    trackLastActivity(
      user.id,
      user.org_id,
      SystemRole.CANDIDATE,
      user.last_activity
    );

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
