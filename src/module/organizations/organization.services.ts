import { Organization } from "./organization.model";
import { AppDataSource } from "../../data-source";
import { CreateOrganizationInput, UpdateOrganizationInput } from "./organization.type";

const organizationRepository = AppDataSource.getRepository(Organization);

const getOrganization = async (filter: object) => {
  console.log("Fetching organization with filter (DB call):", filter);
  return await organizationRepository.findOneBy(filter);
};

const ORG_SETTINGS_FIELDS: (keyof Organization)[] = [
  "id", "name", "slug", "tagline", "address", "has_logo",
  "social_x", "social_facebook", "social_instagram", "social_linkedin", "social_youtube", "social_whatsapp",
];

const getOrgSettings = async (orgId: number) => {
  return organizationRepository.findOne({
    where: { id: orgId },
    select: ORG_SETTINGS_FIELDS,
  });
};

const saveOrganization = async (org: Organization) => {
  return organizationRepository.save(org);
};

export {
  getOrganization,
  getOrgSettings,
  saveOrganization,
};
