import { Request, Response } from "express";
import { getCandidateById } from "../../module/candidate/candidate.services";
import { getOrganization } from "../../module/organizations/organization.services";

/**
 * Resolves org from X-Org-Slug header.
 */
const resolveOrgFromHeader = async (req: Request) => {
    const orgSlug = req.headers["x-org-slug"] as string;
    if (!orgSlug) return null;
    return getOrganization({ slug: orgSlug });
};

/**
 * GET /api/portal/candidates/:id/public
 * Returns a sanitized public candidate profile (no auth required).
 * Hides sensitive data: email, phone, full last name, company names, govt IDs, etc.
 */
export const getPublicCandidateProfile = async (req: Request, res: Response) => {
    try {
        const organization = await resolveOrgFromHeader(req);
        if (!organization) {
            return res
                .status(400)
                .json({ message: "Organization not found. Invalid X-Org-Slug header." });
        }

        const { id } = req.params;
        const candidate = await getCandidateById(Number(id), organization.id);

        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found." });
        }

        // Mask last name: "Shah" → "S."
        const maskedLastName = candidate.last_name
            ? `${candidate.last_name.charAt(0).toUpperCase()}.`
            : "";

        // Sanitize candidate_data: only keep safe fields
        const sanitizedCandidateData = candidate.candidate_data
            ? {
                  designation: candidate.candidate_data.designation ?? null,
                  experience_years: candidate.candidate_data.experience_years ?? null,
                  notice_period: candidate.candidate_data.notice_period ?? null,
                  short_summary: candidate.candidate_data.short_summary ?? null,
                  objectives: candidate.candidate_data.objectives ?? null,
                  linkedin_url: candidate.candidate_data.linkedin_url ?? null,
              }
            : null;

        // Sanitize experiences: hide company names
        const sanitizedExperiences = candidate.experiences
            ? candidate.experiences.map((exp: any) => ({
                  id: exp.id,
                  job_title: exp.job_title,
                  company_name: "Confidential",
                  location: exp.location,
                  start_date: exp.start_date,
                  end_date: exp.end_date,
                  is_present: exp.is_present,
                  description: exp.description,
              }))
            : [];

        // Sanitize metadata: only keep gender, city, state, country
        const sanitizedMetadata = candidate.metadata
            ? {
                  gender: candidate.metadata.gender ?? null,
                  city: candidate.metadata.city ?? null,
                  state: candidate.metadata.state ?? null,
                  country: candidate.metadata.country ?? null,
              }
            : null;

        return res.status(200).json({
            message: "Public candidate profile fetched successfully",
            data: {
                id: candidate.id,
                first_name: candidate.first_name,
                last_name: maskedLastName,
                profile_photo_url: candidate.profile_photo_url,
                candidate_data: sanitizedCandidateData,
                skills: candidate.skills,
                industry: candidate.industry,
                experiences: sanitizedExperiences,
                metadata: sanitizedMetadata,
            },
        });
    } catch (error: any) {
        console.error("Public candidate profile error:", error);
        return res
            .status(500)
            .json({ error: "Internal server error", details: error.message });
    }
};
