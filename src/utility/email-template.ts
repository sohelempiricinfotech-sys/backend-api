import { getOrgSettings } from "../module/organizations/organization.services";
import { getOrgLogoKey, getFileBuffer } from "./s3";
import { EMAIL_ICONS } from "./email-icons";

type SocialKey = "social_x" | "social_facebook" | "social_instagram" | "social_linkedin" | "social_youtube" | "social_whatsapp";

const SOCIAL_CONFIG: { key: SocialKey; icon: keyof typeof EMAIL_ICONS; alt: string }[] = [
  { key: "social_linkedin", icon: "linkedin", alt: "LinkedIn" },
  { key: "social_instagram", icon: "instagram", alt: "Instagram" },
  { key: "social_facebook", icon: "facebook", alt: "Facebook" },
  { key: "social_x", icon: "x", alt: "X" },
  { key: "social_youtube", icon: "youtube", alt: "YouTube" },
  { key: "social_whatsapp", icon: "whatsapp", alt: "WhatsApp" },
];

export async function buildEmailShell(orgId: number): Promise<string> {
  const org = await getOrgSettings(orgId);

  if (!org) throw new Error(`Organization ${orgId} not found`);

  let logoHtml = "";
  if (org.has_logo) {
    try {
      const buffer = await getFileBuffer(getOrgLogoKey(orgId));
      const base64 = buffer.toString("base64");
      logoHtml = `<img src="data:image/webp;base64,${base64}" alt="${org.name}" width="48" height="48" style="border-radius:8px;" />`;
    } catch {
      // Logo unavailable — skip
    }
  }

  const socialLinks = SOCIAL_CONFIG
    .filter((s) => org[s.key])
    .map(
      (s) =>
        `<a href="${org[s.key]}" target="_blank" rel="noopener" style="margin:0 6px;text-decoration:none;"><img src="${EMAIL_ICONS[s.icon]}" alt="${s.alt}" width="24" style="display:inline-block;" /></a>`
    )
    .join("");

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #e4e4e7;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            ${logoHtml ? `<td style="padding-right:14px;vertical-align:middle;">${logoHtml}</td>` : ""}
            <td style="vertical-align:middle;"><span style="font-size:20px;font-weight:700;color:#18181b;">${org.name}</span></td>
          </tr></table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;color:#27272a;font-size:15px;line-height:1.6;">
          __body__
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #e4e4e7;text-align:center;">
          ${socialLinks ? `<div style="margin-bottom:16px;">${socialLinks}</div>` : ""}
          ${org.tagline ? `<p style="margin:0 0 8px;font-size:13px;color:#71717a;font-style:italic;">${org.tagline}</p>` : ""}
          ${org.address ? `<p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">${org.address}</p>` : ""}
          <p style="margin:0;font-size:12px;color:#a1a1aa;">&copy; ${year} ${org.name}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
