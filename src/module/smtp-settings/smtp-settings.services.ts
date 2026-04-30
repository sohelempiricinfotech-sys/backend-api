import { AppDataSource } from "../../data-source";
import { SmtpSettings } from "./smtp-settings.model";

const smtpSettingsRepository = AppDataSource.getRepository(SmtpSettings);

const getSmtpSettings = async (orgId: number) => {
  return smtpSettingsRepository.findOneBy({ org_id: orgId });
};

const upsertSmtpSettings = async (orgId: number, data: Partial<SmtpSettings>, userId: number) => {
  const existing = await smtpSettingsRepository.findOneBy({ org_id: orgId });

  if (existing) {
    Object.assign(existing, data);
    existing.updated_by = userId;
    return smtpSettingsRepository.save(existing);
  }

  const newSettings = smtpSettingsRepository.create({
    ...data,
    org_id: orgId,
    created_by: userId,
  });
  return smtpSettingsRepository.save(newSettings);
};

export { getSmtpSettings, upsertSmtpSettings };
