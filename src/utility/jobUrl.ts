import { getOrganization } from "../module/organizations/organization.services";
import { getSources } from "../module/sources/source.services";

const CAREER_PORTAL_DOMAIN = process.env.CAREER_PORTAL_DOMAIN || "careers.tekpillar.com";
const CAREER_SECURE = process.env.CAREER_SECURE || "false";

export const getRecruiterSourceLinks = (
  sourceLinks: Record<string, string>,
  recruiterUuidId: string
): Record<string, string> => {
  const recruiterLinks: Record<string, string> = {};
  for (const [name, url] of Object.entries(sourceLinks)) {
    const separator = url.includes("?") ? "&" : "?";
    recruiterLinks[name] = `${url}${separator}utm_cin=${recruiterUuidId}`;
  }
  return recruiterLinks;
};

export const getJobSourceLinks = async (
  orgId: number,
  jobId: string
): Promise<Record<string, string>> => {
  const org = await getOrganization({ id: orgId });
  if (!org) {
    return {};
  }

  const baseUrl = `http${CAREER_SECURE == "true" ? "s" : ""}://${org.slug}.${CAREER_PORTAL_DOMAIN}/job/${jobId}`;

  const sourceLinks: Record<string, string> = {
    Default: baseUrl,
  };

  const sources = await getSources({ org_id: orgId });
  for (const source of sources) {
    const utmSource = source.source.toLowerCase().replace(/\s+/g, "_");
    sourceLinks[source.source] = `${baseUrl}?utm_source=${utmSource}`;
  }

  return sourceLinks;
};
