import { hashPassword, validatePassword } from "../../helper/bcryptHelper";
import {
  decodeToken,
  generateAccessToken,
  generateRefreshToken,
} from "../../helper/generateToken";
import { cleanObject } from "../../utility/CommonFunctions";
import { getUser, updateUser, getOrganizationBySlug } from "./auth.services";
import { SystemRole, User } from "../users/user.model";
import { AppDataSource } from "../../data-source";
import { Brackets } from "typeorm";
import { sendOtpEmail } from "../../utility/send-otp-email";

const isSendOtpEmail = process.env.SEND_OTP_EMAIL === "true";
const isDevMode = process.env.NODE_ENV !== "production";
const OTP_EXPIRY_MINUTES = 5;

const userRepository = AppDataSource.getRepository(User);

const ADMIN_ALLOWED_ROLES: string[] = [SystemRole.SUPER_ADMIN, SystemRole.ORG_ADMIN, SystemRole.EMPLOYEE];
const SUPER_ADMIN_ORG_ID = 1;

export const loginFunc = async ({
  email,
  password,
  org_slug,
}: {
  email: string;
  password: string;
  org_slug?: string;
}) => {
  try {
    const normalizedLoginEmail = email.trim().toLowerCase();
    let userOrgId: number | undefined = undefined;

    // If org_slug is provided, validate the organization and add org_id to filter
    if (org_slug) {
      const organization = await getOrganizationBySlug(org_slug);
      if (!organization) {
        return {
          message: "Organization not found.",
          success: false,
          otpSent: true,
        };
      }
      userOrgId = organization.id;
    }

    const user = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email: normalizedLoginEmail })
      .andWhere("user.system_role IN (:...roles)", {
        roles: ADMIN_ALLOWED_ROLES,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("user.system_role = :superRole", {
            superRole: SystemRole.SUPER_ADMIN,
          }).orWhere("user.org_id = :orgId", {
            orgId: userOrgId,
          });
        })
      )
      .getOne();

    if (!user) {
      return {
        message: "User not found.",
        success: false,
        otpSent: true,
      };
    }

    const valid = await validatePassword(password, user.password);
    if (!valid) {
      return {
        message: "Password is incorrect.",
        success: false,
        otpSent: true,
      };
    }

    const oneTimeVerificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const otp_expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await updateUser({ id: user.id, org_id: user.org_id }, { oneTimeVerificationCode, otp_expires_at });

    if (isSendOtpEmail) {
      sendOtpEmail(oneTimeVerificationCode, user.email, user.org_id).catch((err) =>
        console.error("[OTP] Failed to send OTP email:", err.message),
      );
      return {
        message: "OTP sent to your registered email for verification.",
        success: true,
        otpSent: true,
      };
    }

    return {
      message: "OTP sent to your registered email for verification.",
      ...(isDevMode && { oneTimeVerificationCode }),
      success: true,
      otpSent: true,
    };
  } catch (err) {
    return {
      message: "Something went wrong.",
      success: false,
      otpSent: true,
    };
  }
};

export const verifyOtp = async ({
  email,
  otp,
  org_slug,
}: {
  email: string;
  otp: string;
  org_slug?: string;
}) => {
  try {
    let userOrgId: number | undefined = undefined;

    // If org_slug is provided, validate the organization and add org_id to filter
    if (org_slug) {
      const organization = await getOrganizationBySlug(org_slug);
      if (!organization) {
        return {
          message: "Organization not found.",
          success: false,
          otpSent: true,
        };
      }
      userOrgId = organization.id;
    }

    const user = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .andWhere("user.system_role IN (:...roles)", {
        roles: ADMIN_ALLOWED_ROLES,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("user.system_role = :superRole", {
            superRole: SystemRole.SUPER_ADMIN,
          }).orWhere("user.org_id = :orgId", {
            orgId: userOrgId,
          });
        })
      )
      .getOne();

    if (!user) {
      return {
        message: "User not found.",
        success: false,
        otpSent: true,
      };
    }

    if (!user || user.oneTimeVerificationCode !== otp) {
      return {
        success: false,
        message: "OTP is in-valid.",
        verifyOtp: true,
      };
    }

    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      await updateUser({ id: user.id, org_id: user.org_id }, { oneTimeVerificationCode: null, otp_expires_at: null });
      return {
        success: false,
        message: "OTP has expired. Please request a new one.",
        verifyOtp: true,
      };
    }

    const access_token = await generateAccessToken(user.id, user?.role_id, userOrgId as number);
    const refresh_token = await generateRefreshToken(user.id, user?.role_id, userOrgId as number);
    await updateUser(
      { id: user.id, org_id: user.org_id },
      {
        access_token,
        refresh_token,
        oneTimeVerificationCode: null,
        otp_expires_at: null,
      }
    );

    return {
      success: true,
      message: "OTP verified successfully.",
      verifyOtp: true,
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role_id,
        org_id: user.org_id,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: "Someting went wrong.",
      verifyOtp: true,
    };
  }
};

// that funtion use in rpc as well direct in code
export type verifyTokenType = {
  verifyToken: true;
  success: true;
  access_token: string;
  refresh_token: string | null;
  user: {
    id: number;
    email: string;
    role: number | null;
    systemRole: string;
    org_id: number;
    last_activity: Date | null;
  };
};
export const verifyToken = async ({
  access_token,
}: {
  access_token: string;
}): Promise<verifyTokenType> => {
  try {
    let decoded: any;
    try {
      decoded = await decodeToken(access_token);
      const user = await getUser({ id: decoded.sub });
      if (!user) {
        throw "INVALID_TOKEN"
      }

      if (user.system_role != SystemRole.SUPER_ADMIN && user.org_id != decoded.org_id) {
        throw "INVALID_TOKEN"
      }

      return {
        verifyToken: true,
        success: true,
        access_token: access_token,
        refresh_token: user?.refresh_token,
        user: {
          id: user?.id,
          email: user?.email,
          role: user?.role_id,
          systemRole: user?.system_role,
          org_id: decoded.org_id,
          last_activity: user?.last_activity ?? null,
        },
      };
    } catch (err) {
      throw "INVALID_TOKEN"
    }
  } catch (err) {
    throw err;
  }
};

export const refreshToken = async ({
  refresh_token,
}: {
  refresh_token: string;
}) => {
  try {
    let decoded: any;
    try {
      decoded = await decodeToken(refresh_token);
    } catch (err) {
      return {
        success: false,
        message: "Token is in-valid or expired.",
      };
    }
    const user = await getUser({ id: decoded.sub });
    if (!user || user?.refresh_token !== refresh_token) {
      return {
        refreshToken: true,
        success: false,
        message: "Refresh token is in-valid.",
      };
    }

    // Verify user belongs to the org_id in token
    if (user.system_role != SystemRole.SUPER_ADMIN && user.org_id != decoded.org_id) {
      return {
        refreshToken: true,
        success: false,
        message: "User does not belong to this organization.",
      };
    }

    const access_token = await generateAccessToken(user.id, user?.role_id, decoded.org_id);
    await updateUser({ id: user.id, org_id: user.org_id }, { access_token: access_token });
    return {
      success: true,
      refreshToken: true,
      access_token: access_token,
      refresh_token: refresh_token,
      user: {
        id: user?.id,
        email: user?.email,
        role: user?.role_id,
        org_id: user?.org_id,
      },
    };
  } catch (err) {
    return {
      refreshToken: true,
      success: false,
      message: "Something went wrong.",
    };
  }
};
export const logout = async ({
  user: { id: userId },
}: {
  user: { id: string };
}) => {
  try {
    const logoutUser = await getUser({ id: userId });
    if (logoutUser) {
      await updateUser(
        { id: userId, org_id: logoutUser.org_id },
        { oneTimeVerificationCode: null, access_token: null, refresh_token: null }
      );
    }
    return { logout: true, success: true, message: "Logged out successfully." };
  } catch (err) {
    return { logout: true, success: false, message: "Something went wrong." };
  }
};
export const requestPasswordReset = async ({ email, org_slug }: { email: string; org_slug?: string }) => {
  try {
    let userOrgId: number | undefined = undefined;

    if (org_slug) {
      const organization = await getOrganizationBySlug(org_slug);
      if (!organization) {
        return {
          success: false,
          message: "Organization not found.",
          requestPasswordReset: true,
        };
      }
      userOrgId = organization.id;
    }

    const user = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .andWhere("user.system_role IN (:...roles)", {
        roles: ADMIN_ALLOWED_ROLES,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("user.system_role = :superRole", {
            superRole: SystemRole.SUPER_ADMIN,
          }).orWhere("user.org_id = :orgId", {
            orgId: userOrgId,
          });
        })
      )
      .getOne();

    if (!user) {
      return {
        success: false,
        message: "User not found.",
        requestPasswordReset: true,
      };
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await updateUser({ id: user.id, org_id: user.org_id }, { oneTimeVerificationCode: otp, otp_expires_at });

    if (isSendOtpEmail) {
      sendOtpEmail(otp, user.email, user.org_id).catch((err) =>
        console.error("[OTP] Failed to send password reset OTP:", err.message),
      );
      return {
        message: "OTP sent to your email.",
        requestPasswordReset: true,
      };
    }

    return cleanObject({
      message: "OTP sent to your email.",
      ...(isDevMode && { otp }),
      requestPasswordReset: true,
    });
  } catch (err) {
    return {
      success: false,
      message: "Something went wrong.",
      requestPasswordReset: true,
    };
  }
};
export const resetPassword = async ({
  email,
  otp,
  newPassword,
  org_slug,
}: {
  email: string;
  otp: string;
  newPassword: string;
  org_slug?: string;
}) => {
  try {
    let userOrgId: number | undefined = undefined;

    if (org_slug) {
      const organization = await getOrganizationBySlug(org_slug);
      if (!organization) {
        return {
          success: false,
          message: "Organization not found.",
          resetPassword: true,
        };
      }
      userOrgId = organization.id;
    }

    const user = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .andWhere("user.system_role IN (:...roles)", {
        roles: ADMIN_ALLOWED_ROLES,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("user.system_role = :superRole", {
            superRole: SystemRole.SUPER_ADMIN,
          }).orWhere("user.org_id = :orgId", {
            orgId: userOrgId,
          });
        })
      )
      .getOne();

    if (!user || user.oneTimeVerificationCode !== otp) {
      return {
        success: false,
        message: "OTP is in-valid.",
        resetPassword: true,
      };
    }

    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      await updateUser({ id: user.id, org_id: user.org_id }, { oneTimeVerificationCode: null, otp_expires_at: null });
      return {
        success: false,
        message: "OTP has expired. Please request a new one.",
        resetPassword: true,
      };
    }

    const hashedPassword = await hashPassword(newPassword);
    await updateUser(
      { id: user.id, org_id: user.org_id },
      {
        password: hashedPassword,
        oneTimeVerificationCode: null,
        otp_expires_at: null,
      }
    );

    return {
      success: true,
      resetPassword: true,
      message: "Password reset successful.",
    };
  } catch (err) {
    return {
      success: false,
      resetPassword: true,
      message: "Something went wrong.",
    };
  }
};

export const resendOtp = async ({ email, org_slug }: { email: string; org_slug?: string }) => {
  try {
    let userOrgId: number | undefined = undefined;

    if (org_slug) {
      const organization = await getOrganizationBySlug(org_slug);
      if (!organization) {
        return {
          success: false,
          message: "Organization not found.",
          resendOtp: true,
        };
      }
      userOrgId = organization.id;
    }

    const user = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .andWhere("user.system_role IN (:...roles)", {
        roles: ADMIN_ALLOWED_ROLES,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("user.system_role = :superRole", {
            superRole: SystemRole.SUPER_ADMIN,
          }).orWhere("user.org_id = :orgId", {
            orgId: userOrgId,
          });
        })
      )
      .getOne();

    if (!user) {
      return {
        success: false,
        message: "User not found.",
        resendOtp: true,
      };
    }

    const oneTimeVerificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const otp_expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await updateUser({ id: user.id, org_id: user.org_id }, { oneTimeVerificationCode, otp_expires_at });

    if (isSendOtpEmail) {
      sendOtpEmail(oneTimeVerificationCode, user.email, user.org_id).catch((err) =>
        console.error("[OTP] Failed to resend OTP email:", err.message),
      );
      return {
        message: "OTP resent to your registered email.",
        success: true,
        resendOtp: true,
      };
    }

    return {
      message: "OTP resent to your registered email.",
      ...(isDevMode && { oneTimeVerificationCode }),
      success: true,
      resendOtp: true,
    };
  } catch (err) {
    return {
      success: false,
      message: "Something went wrong.",
      resendOtp: true,
    };
  }
};
