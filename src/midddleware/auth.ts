import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../module/auth/auth.controller";
import { trackLastActivity } from "./track-last-activity";


export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1] as string;
    try {
        const response = await verifyToken({
            access_token: token
        })
        req.loginUser = response;

        // Track last activity (fire-and-forget, never blocks the request)
        trackLastActivity(
            response.user.id,
            response.user.org_id,
            response.user.systemRole,
            response.user.last_activity
        );

        next();
    } catch (err) {
        return res.status(401).send({
            messgae: "Auth Server Error",
            err
        })
    }
}
