import { getSmtpSettings } from "../module/smtp-settings/smtp-settings.services";
import { buildEmailShell } from "./email-template";
import { publishEmail, EmailPriority } from "./email-publisher";

function buildOtpHtml(otp: string): string {
  return `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#18181b;">Verification Code</h2>
    <p style="margin:0 0 24px;color:#52525b;">Use the code below to verify your identity. This code will expire shortly.</p>
    <div style="text-align:center;margin:0 0 24px;">
      <span style="display:inline-block;padding:16px 32px;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b;background-color:#f4f4f5;border-radius:8px;border:1px solid #e4e4e7;">${otp}</span>
    </div>
    <p style="margin:0;font-size:13px;color:#a1a1aa;">If you did not request this code, please ignore this email.</p>
  `;
}

export async function sendOtpEmail(
  otp: string,
  email: string,
  orgId: number,
): Promise<void> {
  const smtpSettings = await getSmtpSettings(orgId);
  if (!smtpSettings) {
    throw new Error(`[sendOtpEmail] No SMTP settings configured for org ${orgId}`);
  }

  const shell = await buildEmailShell(orgId);

  const otpBody = buildOtpHtml(otp);

  const html = shell.replace("__body__", otpBody);

  await publishEmail(
    {
      to: email,
      subject: "Your Verification Code",
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
