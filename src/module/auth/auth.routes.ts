import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import {
  loginFunc,
  verifyOtp,
  verifyToken,
  refreshToken,
  logout,
  requestPasswordReset,
  resetPassword,
  resendOtp,
} from "./auth.controller";
import { zValidate } from "../../midddleware/zvalidate";
import {
  loginSchema,
  verifyOTPSchema,
  requestPasswordResetSchema,
  passwordResetSchema,
  refreshTokenSchema,
  verifyTokenSchema,
  resendOtpSchema,
} from "./auth.validation";

const router = express.Router();

// Strict rate limit for sensitive auth endpoints (login, OTP, password reset)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again after 15 minutes." },
});

// General rate limit for other auth endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

// Login - sends OTP
router.post("/login", strictLimiter, zValidate(loginSchema), async (req: Request, res: Response) => {
  try {
    // Extract org slug from header (X-Org-Slug)
    const org_slug = req.headers['x-org-slug'] as string | undefined;
    const result = await loginFunc({ ...req.body, org_slug });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
});

// Verify OTP - returns tokens
router.post("/verify-otp", strictLimiter, zValidate(verifyOTPSchema), async (req: Request, res: Response) => {
  try {
    const org_slug = req.headers['x-org-slug'] as string | undefined;
    const result = await verifyOtp({ ...req.body, org_slug });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
});

// Resend OTP
router.post("/resend-otp", strictLimiter, zValidate(resendOtpSchema), async (req: Request, res: Response) => {
  try {
    const org_slug = req.headers['x-org-slug'] as string | undefined;
    const result = await resendOtp({ ...req.body, org_slug });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
});

// Verify access token
router.post("/verify-token", generalLimiter, zValidate(verifyTokenSchema), async (req: Request, res: Response) => {
  try {
    const result = await verifyToken(req.body);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message || "Invalid token" });
  }
});

// Refresh access token
router.post("/refresh-token", generalLimiter, zValidate(refreshTokenSchema), async (req: Request, res: Response) => {
  try {
    const refreshedSession = await refreshToken(req.body);
    return res.status(200).json(refreshedSession);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
});

// Request password reset - sends OTP
router.post("/request-password-reset", strictLimiter, zValidate(requestPasswordResetSchema), async (req: Request, res: Response) => {
  try {
    const org_slug = req.headers['x-org-slug'] as string | undefined;
    const result = await requestPasswordReset({ ...req.body, org_slug });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
});

// Reset password with OTP
router.post("/reset-password", strictLimiter, zValidate(passwordResetSchema), async (req: Request, res: Response) => {
  try {
    const org_slug = req.headers['x-org-slug'] as string | undefined;
    const result = await resetPassword({ ...req.body, org_slug });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
});

// Logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];
    const tokenData = await verifyToken({ access_token: token });
    const result = await logout({ user: { id: String(tokenData.user.id) } });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
});

// Health check
router.get("/check", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default router;
