import { AppDataSource } from "../../data-source";
import { User, SystemRole } from "../../module/users/user.model";
import { CandidateData } from "../../module/candidate-data/candidate-data.model";
import { CandidateSkill } from "../../module/candidate-skills/candidate-skill.model";
import { Skill } from "../../module/skills/skill.model";
import { Experience } from "../../module/experience/experience.model";
import { UserMetadata } from "../../module/user-metadata/user-metadata.model";
import { Industry } from "../../module/industries/industry.model";
import { IsNull } from "typeorm";
import { getFileUrl, getProfilePhotoSignedUrl } from "../../utility/s3";
import { getResumes } from "../../module/resumes/resume.services";

const userRepository = AppDataSource.getRepository(User);
const candidateDataRepository = AppDataSource.getRepository(CandidateData);
const candidateSkillRepository = AppDataSource.getRepository(CandidateSkill);
const experienceRepository = AppDataSource.getRepository(Experience);
const userMetadataRepository = AppDataSource.getRepository(UserMetadata);
const industryRepository = AppDataSource.getRepository(Industry);

export const getCandidateProfile = async (userId: number, orgId: number) => {
  const user = await userRepository.findOne({
    where: {
      id: userId,
      org_id: orgId,
      system_role: SystemRole.CANDIDATE,
      deleted_at: IsNull(),
    },
  });

  if (!user) return null;

  const { password, access_token, refresh_token, oneTimeVerificationCode, two_factor_otp, otp_expires_at, ...userSafe } = user;

  const candidateData = await candidateDataRepository.findOne({
    where: { user_id: userId, org_id: orgId },
  });

  const candidateSkills = await candidateSkillRepository
    .createQueryBuilder("cs")
    .leftJoinAndSelect(Skill, "skill", "skill.id = cs.skill_id AND skill.org_id = cs.org_id")
    .where("cs.user_id = :user_id", { user_id: userId })
    .andWhere("cs.org_id = :org_id", { org_id: orgId })
    .select(["cs.skill_id as value", "skill.name as label"])
    .getRawMany();

  let industry = null;
  if (candidateData?.industry_id) {
    const industryRecord = await industryRepository.findOne({
      where: { id: candidateData.industry_id, org_id: orgId, deleted_at: IsNull() },
    });
    if (industryRecord) {
      industry = { value: String(industryRecord.id), label: industryRecord.industry };
    }
  }

  const experiences = await experienceRepository.find({
    where: { user_id: userId, org_id: orgId, deleted_at: IsNull() },
    order: { start_date: "DESC" },
  });

  const metadata = await userMetadataRepository.findOne({
    where: { user_id: userId, org_id: orgId, deleted_at: IsNull() },
  });

  // Generate signed profile photo URL from userId
  let profile_photo_url: string | null = null;
  try {
    profile_photo_url = await getProfilePhotoSignedUrl(userId);
  } catch {
    profile_photo_url = null;
  }

  // Fetch resumes with signed URLs
  const resumeRecords = await getResumes({
    user_id: userId,
    org_id: orgId,
    deleted_at: IsNull(),
  });
  const resumes = await Promise.all(
    resumeRecords.map(async (resume) => {
      let file_url: string | null = null;
      if (resume.file_path) {
        try {
          file_url = await getFileUrl(resume.file_path);
        } catch {
          file_url = null;
        }
      }
      return {
        id: resume.id,
        file_name: resume.file_name,
        file_path: resume.file_path,
        file_url,
      };
    })
  );

  return {
    ...userSafe,
    profile_photo_url,
    candidate_data: candidateData,
    skills: candidateSkills.map((s: any) => ({
      value: String(s.value),
      label: s.label,
    })),
    industry,
    experiences,
    resumes,
    metadata: metadata
      ? {
          gender: metadata.gender,
          date_of_birth: metadata.date_of_birth,
          address_line_1: metadata.address_line_1,
          address_line_2: metadata.address_line_2,
          city: metadata.city,
          state: metadata.state,
          pincode: metadata.pincode,
          country: metadata.country,
          aadhar_card_number: metadata.aadhar_card_number,
          pan_card_number: metadata.pan_card_number,
        }
      : null,
  };
};

export const updateCandidateProfile = async (
  userId: number,
  orgId: number,
  data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    designation?: string | null;
    experience_years?: number | null;
    notice_period?: number | null;
    short_summary?: string | null;
    objectives?: string[] | null;
    industry_id?: number | null;
    linkedin_url?: string | null;
    skills?: number[];
  }
) => {
  const { skills, ...candidateFields } = data;

  // Update user fields
  const userFields: Record<string, any> = { updated_by: userId };
  if (candidateFields.first_name !== undefined)
    userFields.first_name = candidateFields.first_name;
  if (candidateFields.last_name !== undefined)
    userFields.last_name = candidateFields.last_name;
  if (candidateFields.phone !== undefined)
    userFields.phone = candidateFields.phone;

  await userRepository.update(
    { id: userId, org_id: orgId, system_role: SystemRole.CANDIDATE },
    userFields
  );

  // Update candidate data
  const candidateDataFields: Record<string, any> = { updated_by: userId };
  if (candidateFields.designation !== undefined)
    candidateDataFields.designation = candidateFields.designation;
  if (candidateFields.experience_years !== undefined)
    candidateDataFields.experience_years = candidateFields.experience_years;
  if (candidateFields.notice_period !== undefined)
    candidateDataFields.notice_period = candidateFields.notice_period;
  if (candidateFields.short_summary !== undefined)
    candidateDataFields.short_summary = candidateFields.short_summary;
  if (candidateFields.objectives !== undefined)
    candidateDataFields.objectives = candidateFields.objectives;
  if (candidateFields.industry_id !== undefined)
    candidateDataFields.industry_id = candidateFields.industry_id;
  if (candidateFields.linkedin_url !== undefined)
    candidateDataFields.linkedin_url = candidateFields.linkedin_url;

  // Only update if there are fields beyond updated_by
  if (Object.keys(candidateDataFields).length > 1) {
    const existing = await candidateDataRepository.findOne({
      where: { user_id: userId, org_id: orgId },
    });

    if (existing) {
      await candidateDataRepository.update(
        { user_id: userId, org_id: orgId },
        candidateDataFields
      );
    } else {
      // Create candidate_data if it doesn't exist yet (onboarded user)
      const newCandidateData = candidateDataRepository.create({
        org_id: orgId,
        user_id: userId,
        ...candidateDataFields,
        created_by: userId,
      });
      await candidateDataRepository.save(newCandidateData);
    }
  }

  // Update skills if provided
  if (skills !== undefined) {
    await candidateSkillRepository.delete({ user_id: userId, org_id: orgId });

    if (skills.length > 0) {
      const skillEntities = skills.map((skillId) =>
        candidateSkillRepository.create({
          org_id: orgId,
          user_id: userId,
          skill_id: skillId,
        })
      );
      await candidateSkillRepository.save(skillEntities);
    }
  }

  return getCandidateProfile(userId, orgId);
};
