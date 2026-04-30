import { Request, Response } from "express";
import { hashPassword, validatePassword } from "../../helper/bcryptHelper";
import { AppDataSource } from "../../data-source";
import { User, SystemRole } from "../../module/users/user.model";
import * as experienceService from "../../module/experience/experience.services";
import * as userMetadataService from "../../module/user-metadata/user-metadata.services";
import * as resumeService from "../../module/resumes/resume.services";
import * as portalCandidateService from "./portal-candidate.services";
import { addCandidateIndex } from "../../elastic-index/candidate/candidate.operation";
import { reindexByCandidate } from "../../elastic-index/reindex/reindex-candidate";

const userRepository = AppDataSource.getRepository(User);

/**
 * GET /api/portal/candidate/profile
 * Get the logged-in candidate's full profile.
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { id, org_id } = req.portalUser;

    const profile = await portalCandidateService.getCandidateProfile(id, org_id);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    return res.status(200).json({
      message: "Profile fetched successfully.",
      data: profile,
    });
  } catch (error: any) {
    console.error("Portal get profile error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * PATCH /api/portal/candidate/profile
 * Update the logged-in candidate's profile.
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id, org_id } = req.portalUser;
    const { experiences, metadata, resumes, ...profileData } = req.body;

    const updatedProfile = await portalCandidateService.updateCandidateProfile(
      id,
      org_id,
      profileData
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    // Handle experiences if provided
    if (experiences) {
      for (const exp of experiences) {
        if (exp.id && exp.isDeleted) {
          // Soft delete existing experience
          await experienceService.deleteExperience(
            { id: exp.id },
            { deleted_at: new Date(), deleted_by: id }
          );
        } else if (exp.id && !exp.isDeleted) {
          // Update existing experience (ensure it belongs to this candidate)
          const existingExp = await experienceService.getExperience({
            id: exp.id,
            org_id,
            user_id: id,
            deleted_at: null,
          });
          if (existingExp) {
            await experienceService.updateExperience(
              { id: exp.id },
              existingExp,
              {
                job_title: exp.job_title,
                company_name: exp.company_name,
                location: exp.location,
                start_date: exp.start_date ? new Date(exp.start_date) : null,
                end_date: exp.is_present
                  ? null
                  : exp.end_date
                    ? new Date(exp.end_date)
                    : null,
                is_present: exp.is_present || false,
                description: exp.description,
                updated_by: id,
              }
            );
          }
        } else if (!exp.id && !exp.isDeleted) {
          // Create new experience
          await experienceService.createExperience({
            org_id,
            user_id: id,
            job_title: exp.job_title || null,
            company_name: exp.company_name || null,
            location: exp.location || null,
            start_date: exp.start_date ? new Date(exp.start_date) : null,
            end_date: exp.is_present
              ? null
              : exp.end_date
                ? new Date(exp.end_date)
                : null,
            is_present: exp.is_present || false,
            description: exp.description || null,
            experience_letter_file: null,
            salary_slip_file: null,
            created_by: id,
            updated_by: null,
            deleted_by: null,
          });
        }
      }
    }

    // Handle metadata if provided
    if (metadata) {
      const existingMetadata = await userMetadataService.getUserMetadataOne({
        user_id: id,
        org_id,
        deleted_at: null,
      });

      if (existingMetadata) {
        await userMetadataService.updateUserMetadata(
          { id: existingMetadata.id },
          existingMetadata,
          {
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
            updated_by: id,
          }
        );
      } else {
        await userMetadataService.createUserMetadata({
          org_id,
          user_id: id,
          gender: metadata.gender || null,
          date_of_birth: metadata.date_of_birth || null,
          address_line_1: metadata.address_line_1 || null,
          address_line_2: metadata.address_line_2 || null,
          city: metadata.city || null,
          state: metadata.state || null,
          pincode: metadata.pincode || null,
          country: metadata.country || null,
          aadhar_card_number: metadata.aadhar_card_number || null,
          pan_card_number: metadata.pan_card_number || null,
          created_by: id,
          updated_by: null,
          deleted_by: null,
        });
      }
    }

    // Handle resumes if provided
    if (resumes && Array.isArray(resumes)) {
      for (const resume of resumes) {
        await resumeService.createResume({
          org_id,
          user_id: id,
          file_name: resume.file_name,
          file_path: resume.file_path,
          created_by: id,
          updated_by: null,
          deleted_by: null,
        });
      }
    }

    // Re-fetch the full profile with updated data
    const fullProfile = await portalCandidateService.getCandidateProfile(
      id,
      org_id
    );

    // Update candidate index in Elasticsearch
    if (fullProfile) addCandidateIndex(fullProfile?.id, fullProfile?.org_id);

    // Reindex submissions that reference this candidate
    reindexByCandidate(id, org_id);

    return res.status(200).json({
      message: "Profile updated successfully.",
      data: fullProfile,
    });
  } catch (error: any) {
    console.error("Portal update profile error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * POST /api/portal/candidate/change-password
 * Change the logged-in candidate's password.
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { id, org_id } = req.portalUser;
    const { current_password, new_password } = req.body;

    const user = await userRepository.findOneBy({
      id,
      org_id,
      system_role: SystemRole.CANDIDATE,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.password) {
      return res
        .status(400)
        .json({ message: "No password set. Please contact support." });
    }

    const isValid = await validatePassword(current_password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await hashPassword(new_password);
    await userRepository.update({ id, org_id }, { password: hashedPassword });

    return res
      .status(200)
      .json({ message: "Password changed successfully.", success: true });
  } catch (error: any) {
    console.error("Portal change password error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * POST /api/portal/candidate/complete-onboarding
 * Mark the logged-in candidate as onboarded (complete or skip).
 */
export const completeOnboarding = async (req: Request, res: Response) => {
  try {
    const { id, org_id } = req.portalUser;

    await userRepository.update(
      { id, org_id, system_role: SystemRole.CANDIDATE },
      { onboard: true }
    );

    return res.status(200).json({
      message: "Onboarding completed successfully.",
      success: true,
    });
  } catch (error: any) {
    console.error("Portal complete onboarding error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * GET /api/portal/candidate/experiences
 * Get the logged-in candidate's experiences.
 */
export const getExperiences = async (req: Request, res: Response) => {
  try {
    const { id, org_id } = req.portalUser;

    const experiences = await experienceService.getExperiences({
      org_id,
      user_id: id,
      deleted_at: null,
    });

    return res.status(200).json({
      message: "Experiences fetched successfully.",
      data: experiences,
    });
  } catch (error: any) {
    console.error("Portal get experiences error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
