import { Request, Response, NextFunction } from "express";

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Factory that returns Express middleware to verify a Google reCAPTCHA v3 token.
 *
 * - Reads `recaptcha_token` from `req.body` and deletes it before calling `next()`
 *   so downstream Zod validation won't reject the unknown field.
 * - **Dev bypass:** if `RECAPTCHA_SECRET_KEY` env var is not set AND not in production, skips verification.
 * - **Production:** reCAPTCHA is enforced. Missing secret key or Google API errors will block the request.
 */
export function verifyRecaptcha(expectedAction: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      // In production, missing secret key is a configuration error — block the request
      if (isProduction) {
        console.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY is not configured in production");
        return res.status(500).json({
          success: false,
          message: "Server configuration error",
        });
      }
      // Dev bypass — no secret key configured
      delete req.body.recaptcha_token;
      return next();
    }

    const token = req.body.recaptcha_token;
    delete req.body.recaptcha_token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification failed: no token provided",
      });
    }

    try {
      const response = await fetch(RECAPTCHA_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        return res.status(400).json({
          success: false,
          message: "reCAPTCHA verification failed",
        });
      }

      // Verify the action matches what we expected
      if (data.action && data.action !== expectedAction) {
        return res.status(400).json({
          success: false,
          message: "reCAPTCHA verification failed: action mismatch",
        });
      }

      // Check score threshold
      const threshold = parseFloat(
        process.env.RECAPTCHA_SCORE_THRESHOLD || "0.5"
      );
      if (typeof data.score === "number" && data.score < threshold) {
        return res.status(403).json({
          success: false,
          message: "Request blocked due to suspicious activity",
        });
      }

      return next();
    } catch (error) {
      console.error("[reCAPTCHA] Verification error:", error);

      if (isProduction) {
        // Fail closed in production — don't let unverified requests through
        return res.status(503).json({
          success: false,
          message: "Unable to verify request. Please try again later.",
        });
      }

      // Fail open in dev — Google API unreachable, don't block the developer
      return next();
    }
  };
}
