import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { hashPassword, validatePassword } from "../../helper/bcryptHelper";
import {
  generateAccessToken,
  generateRefreshToken,
  decodeToken,
} from "../../helper/generateToken";
import { generateUniqueId } from "../../utility/uniqueid";
import { SystemRole } from "../../module/users/user.model";
import { isUniqueViolation } from "../../utility/unique";
import {
  getOrganizationBySlug,
  getCandidateUser,
  createCandidateUser,
  updateCandidateUser,
} from "./portal-auth.services";
import { addCandidateIndex } from "../../elastic-index/candidate/candidate.operation";
import { sendResetEmail } from "../../utility/send-reset-email";
import { reindexByCandidate } from "../../elastic-index/reindex";

/**
 * Extracts org_id from X-Org-Slug header.
 * All portal requests must include this header.
 */
const resolveOrgFromHeader = async (req: Request) => {
  const orgSlug = req.headers["x-org-slug"] as string;
  if (!orgSlug) {
    return null;
  }
  return getOrganizationBySlug(orgSlug);
};

/**
 * POST /api/portal/auth/login
 * Candidate login with email + password.
 * Org is resolved from X-Org-Slug header.
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const organization = await resolveOrgFromHeader(req);
    if (!organization) {
      return res
        .status(400)
        .json({ message: "Organization not found. Invalid X-Org-Slug header." });
    }

    const user = await getCandidateUser({
      email,
      org_id: organization.id,
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.password) {
      return res
        .status(401)
        .json({ message: "Please sign up to set your password.", no_password: true });
    }

    const isValid = await validatePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.deleted_at) {
      return res
        .status(403)
        .json({ message: "Your account has been deactivated." });
    }

    const access_token = await generateAccessToken(
      user.id,
      user.role_id,
      organization.id
    );
    const refresh_token = await generateRefreshToken(
      user.id,
      user.role_id,
      organization.id
    );

    await updateCandidateUser(
      { id: user.id, org_id: organization.id },
      { access_token, refresh_token }
    );

    return res.status(200).json({
      message: "Login successful.",
      success: true,
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        org_id: organization.id,
        onboard: user.onboard ?? false,
      },
    });
  } catch (error: any) {
    console.error("Portal login error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * POST /api/portal/auth/register
 * Onboard/register a new candidate with password.
 * Org is resolved from X-Org-Slug header.
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;

    const organization = await resolveOrgFromHeader(req);
    if (!organization) {
      return res
        .status(400)
        .json({ message: "Organization not found. Invalid X-Org-Slug header." });
    }

    const existingUser = await getCandidateUser({
      email,
      org_id: organization.id,
    });

    if (existingUser) {
      // User already has a password — fully registered, reject duplicate
      if (existingUser.password) {
        return res.status(409).json({
          message: "A candidate with this email already exists.",
          email,
        });
      }

      // User exists without password (admin-created) — claim the account
      const hashedPassword = await hashPassword(password);

      await updateCandidateUser(
        { id: existingUser.id, org_id: organization.id },
        {
          first_name,
          last_name,
          phone: phone || existingUser.phone,
          password: hashedPassword,
          is_password: true,
          onboard: false,
        }
      );

      const access_token = await generateAccessToken(
        existingUser.id,
        existingUser.role_id,
        organization.id
      );
      const refresh_token = await generateRefreshToken(
        existingUser.id,
        existingUser.role_id,
        organization.id
      );

      await updateCandidateUser(
        { id: existingUser.id, org_id: organization.id },
        { access_token, refresh_token }
      );

      // Add new candidate to Elasticsearch index
      await addCandidateIndex(existingUser.id, organization.id)

      reindexByCandidate(existingUser.id, organization.id)

      return res.status(200).json({
        message: "Account activated successfully.",
        success: true,
        already_in_system: true,
        access_token,
        refresh_token,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          first_name,
          last_name,
          org_id: organization.id,
          onboard: false,
        },
      });
    }

    const hashedPassword = await hashPassword(password);

    const candidateUser = await createCandidateUser({
      org_id: organization.id,
      role_id: null,
      unique_id: generateUniqueId(SystemRole.CANDIDATE),
      first_name,
      last_name,
      email,
      phone: phone || null,
      password: hashedPassword,
      is_password: true,
      is_verified: false,
      status: "Active",
      created_by: null,
      updated_by: null,
      deleted_by: null,
    });

    const access_token = await generateAccessToken(
      candidateUser.id,
      null,
      organization.id
    );
    const refresh_token = await generateRefreshToken(
      candidateUser.id,
      null,
      organization.id
    );

    await updateCandidateUser(
      { id: candidateUser.id, org_id: organization.id },
      { access_token, refresh_token }
    );

    // Add new candidate to Elasticsearch index
    await addCandidateIndex(candidateUser.id, candidateUser.org_id)

    return res.status(201).json({
      message: "Registration successful.",
      success: true,
      access_token,
      refresh_token,
      user: {
        id: candidateUser.id,
        email: candidateUser.email,
        first_name: candidateUser.first_name,
        last_name: candidateUser.last_name,
        org_id: organization.id,
        onboard: candidateUser.onboard ?? false,
      },
    });
  } catch (error: any) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({
        message: "A candidate with this email already exists.",
      });
    }
    console.error("Portal register error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * POST /api/portal/auth/refresh-token
 * Refresh candidate access token using refresh token.
 */
export const portalRefreshToken = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    let decoded: any;
    try {
      decoded = await decodeToken(refresh_token);
    } catch {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token." });
    }

    const user = await getCandidateUser({
      id: decoded.sub,
      org_id: decoded.org_id,
    });

    if (!user || user.refresh_token !== refresh_token) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const access_token = await generateAccessToken(
      user.id,
      user.role_id,
      user.org_id
    );

    await updateCandidateUser({ id: user.id, org_id: user.org_id }, { access_token });

    return res.status(200).json({
      message: "Token refreshed successfully.",
      success: true,
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        org_id: user.org_id,
        onboard: user.onboard ?? false,
      },
    });
  } catch (error: any) {
    console.error("Portal refresh token error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * POST /api/portal/auth/logout
 * Logout candidate by clearing tokens.
 * Protected route (requires portalAuthMiddleware).
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const { id } = req.portalUser;

    const { org_id } = req.portalUser;
    await updateCandidateUser(
      { id, org_id },
      { access_token: null, refresh_token: null }
    );

    return res
      .status(200)
      .json({ message: "Logged out successfully.", success: true });
  } catch (error: any) {
    console.error("Portal logout error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * POST /api/portal/auth/forgot-password
 * Send password reset email to candidate.
 * Always returns 200 to prevent email enumeration.
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const organization = await resolveOrgFromHeader(req);
    if (!organization) {
      return res
        .status(400)
        .json({ message: "Organization not found. Invalid X-Org-Slug header." });
    }

    const user = await getCandidateUser({
      email,
      org_id: organization.id,
    });

    // Always return 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        message: "If an account exists with this email, you will receive a password reset link.",
        success: true,
      });
    }

    const resetToken = jwt.sign(
      { sub: user.id, org_id: organization.id, email: user.email, purpose: "password_reset" },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );

    await sendResetEmail(resetToken, user.email, organization.id);

    return res.status(200).json({
      message: "If an account exists with this email, you will receive a password reset link.",
      success: true,
    });
  } catch (error: any) {
    console.error("Portal forgot password error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * POST /api/portal/auth/reset-password
 * Reset candidate password using a signed JWT token.
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset link. Please request a new one." });
    }

    if (decoded.purpose !== "password_reset") {
      return res
        .status(400)
        .json({ message: "Invalid reset token." });
    }

    const user = await getCandidateUser({
      id: decoded.sub,
      org_id: decoded.org_id,
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid reset token." });
    }

    const hashedPassword = await hashPassword(password);

    await updateCandidateUser(
      { id: user.id, org_id: decoded.org_id },
      { password: hashedPassword, access_token: null, refresh_token: null }
    );

    return res.status(200).json({
      message: "Password reset successful. You can now log in with your new password.",
      success: true,
    });
  } catch (error: any) {
    console.error("Portal reset password error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
