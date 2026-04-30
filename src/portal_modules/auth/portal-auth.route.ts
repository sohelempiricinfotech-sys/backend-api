import { Router } from "express";
import rateLimit from "express-rate-limit";
import { zValidate } from "../../midddleware/zvalidate";
import {
  portalLoginSchema,
  portalRegisterSchema,
  portalRefreshTokenSchema,
  portalForgotPasswordSchema,
  portalResetPasswordSchema,
} from "./portal-auth.validation";
import {
  login,
  register,
  portalRefreshToken,
  logout,
  forgotPassword,
  resetPassword,
} from "./portal-auth.controller";
import { portalAuthMiddleware } from "../middleware/portal-auth.middleware";
import { verifyRecaptcha } from "../middleware/recaptcha.middleware";

const router = Router();

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again after 15 minutes." },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

// Public routes (no auth required)
router.post("/login", strictLimiter, zValidate(portalLoginSchema), login);
router.post("/register", strictLimiter, verifyRecaptcha("register"), zValidate(portalRegisterSchema), register);
router.post(
  "/refresh-token",
  generalLimiter,
  zValidate(portalRefreshTokenSchema),
  portalRefreshToken
);
router.post(
  "/forgot-password",
  strictLimiter,
  verifyRecaptcha("forgot_password"),
  zValidate(portalForgotPasswordSchema),
  forgotPassword
);
router.post(
  "/reset-password",
  strictLimiter,
  zValidate(portalResetPasswordSchema),
  resetPassword
);

// Protected routes (requires candidate token)
router.post("/logout", portalAuthMiddleware, logout);

export default router;
