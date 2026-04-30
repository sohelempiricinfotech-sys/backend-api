import { getSmtpSettings } from "../module/smtp-settings/smtp-settings.services";
import { getOrganization } from "../module/organizations/organization.services";
import { buildEmailShell } from "./email-template";
import { publishEmail, EmailPriority } from "./email-publisher";

const CAREER_PORTAL_DOMAIN = process.env.CAREER_PORTAL_DOMAIN || "careers.tekpillar.com";
const CAREER_SECURE = process.env.CAREER_SECURE || "false";

function buildResetHtml(resetUrl: string): string {
  return `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#18181b;">Reset Your Password</h2>
    <p style="margin:0 0 24px;color:#52525b;">We received a request to reset your password. Click the button below to set a new password. This link will expire in 15 minutes.</p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${resetUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 32px;font-size:16px;font-weight:600;color:#ffffff;background-color:#18181b;border-radius:8px;text-decoration:none;">Reset Password</a>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="margin:0 0 16px;font-size:13px;color:#71717a;word-break:break-all;">${resetUrl}</p>
    <p style="margin:0;font-size:13px;color:#a1a1aa;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
  `;
}

export async function sendResetEmail(
  token: string,
  email: string,
  orgId: number,
): Promise<void> {
  const smtpSettings = await getSmtpSettings(orgId);
  if (!smtpSettings) {
    throw new Error(`[sendResetEmail] No SMTP settings configured for org ${orgId}`);
  }

  const org = await getOrganization({ id: orgId });
  if (!org) {
    throw new Error(`[sendResetEmail] Organization ${orgId} not found`);
  }

  const protocol = CAREER_SECURE === "true" ? "https" : "http";
  const resetUrl = `${protocol}://${org.slug}.${CAREER_PORTAL_DOMAIN}/reset-password?token=${token}`;

  const shell = await buildEmailShell(orgId);
  const html = shell.replace("__body__", buildResetHtml(resetUrl));

  await publishEmail(
    {
      to: email,
      subject: "Reset Your Password",
      html,
      from_email: smtpSettings.from_email,
      from_name: smtpSettings.from_name ?? undefined,
      smtp: {
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        username: smtpSettings.username,
        password: smtpSettings.password,
      },
    },
    EmailPriority.HIGH,
  );
}
