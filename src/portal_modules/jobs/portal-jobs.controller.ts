import { Request, Response } from "express";
import * as jobService from "../../module/job/job.services";
import * as jobSkillService from "../../module/job-skills/job-skill.services";
import * as questionService from "../../module/questions/question.services";
import { JobStatus } from "../../module/job/job.type";
import { AppDataSource } from "../../data-source";
import { Skill } from "../../module/skills/skill.model";
import { Industry } from "../../module/industries/industry.model";
import { getOrganization } from "../../module/organizations/organization.services";
import { IsNull, Like } from "typeorm";

const skillRepository = AppDataSource.getRepository(Skill);
const industryRepository = AppDataSource.getRepository(Industry);

/**
 * Resolves org from X-Org-Slug header.
 */
const resolveOrgFromHeader = async (req: Request) => {
  const orgSlug = req.headers["x-org-slug"] as string;
  if (!orgSlug) return null;
  return getOrganization({ slug: orgSlug });
};

/**
 * GET /api/portal/jobs
 * List active jobs for the organization (resolved from X-Org-Slug header).
 * Supports pagination, search, and filters.
 */
export const getPortalJobs = async (req: Request, res: Response) => {
  try {
    const organization = await resolveOrgFromHeader(req);
    if (!organization) {
      return res
        .status(400)
        .json({ message: "Organization not found. Invalid X-Org-Slug header." });
    }

    const {
      limit = 20,
      search_after,
      search,
      skillIds,
      industryId,
      job_type,
      remote_status,
      city,
      state,
      country,
      experience_min,
      experience_max,
      ctc_min,
      ctc_max,
    } = req.query;

    const parsedSkillIds = skillIds
      ? (skillIds as string)
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n))
      : undefined;

    const parsedSearchAfter = search_after
      ? (search_after as string).split(",").map((v) => {
          const num = Number(v);
          return isNaN(num) ? v : num;
        })
      : undefined;

    const result = await jobService.getJobsList(organization.id, {
      search_after: parsedSearchAfter,
      limit: Number(limit),
      search: search as string,
      filters: {
        skillIds:
          parsedSkillIds && parsedSkillIds.length > 0
            ? parsedSkillIds
            : undefined,
        industryId: industryId ? parseInt(industryId as string) : undefined,
        job_type: (job_type as string) || undefined,
        status: [JobStatus.ACTIVE],
        published: true,
        remote_status: (remote_status as string) || undefined,
        city: (city as string) || undefined,
        state: (state as string) || undefined,
        country: (country as string) || undefined,
        experience_min: experience_min ? Number(experience_min) : undefined,
        experience_max: experience_max ? Number(experience_max) : undefined,
        ctc_min: ctc_min ? Number(ctc_min) : undefined,
        ctc_max: ctc_max ? Number(ctc_max) : undefined,
      },
    });

    return res.status(200).json({
      message: "Jobs fetched successfully",
      data: {
        ...result,
        organization: { id: organization.id, name: organization.name },
      },
    });
  } catch (error: any) {
    console.error("Portal get jobs error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * GET /api/portal/jobs/:id
 * Get a single job with full details (skills, industry, questions).
 */
export const getPortalJob = async (req: Request, res: Response) => {
  try {
    const organization = await resolveOrgFromHeader(req);
    if (!organization) {
      return res
        .status(400)
        .json({ message: "Organization not found. Invalid X-Org-Slug header." });
    }

    const { id } = req.params;

    const job = await jobService.getJobPostWithProject({
      id,
      org_id: organization.id,
      deleted_at: IsNull(),
    });

    if (!job || (job.status !== JobStatus.ACTIVE && job.status !== JobStatus.CLOSED)) {
      return res.status(404).json({ message: "Job not found." });
    }

    const skills = await jobSkillService.getJobPostSkillsWithNames(
      id,
      organization.id
    );

    const industry = job.industry_id
      ? await jobService.getIndustryById(job.industry_id, organization.id)
      : null;

    const questions = await questionService.getQuestionsByJobId(
      id,
      organization.id
    );

    return res.status(200).json({
      message: "Job fetched successfully",
      data: {
        ...job,
        skills,
        industry,
        questions,
        organization: { id: organization.id, name: organization.name },
        project: job.project
          ? { id: job.project.id, name: job.project.name }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Portal get job error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * GET /api/portal/jobs/filter-options
 * Returns available filter options (skills, industries) for the organization.
 */
export const getPortalFilterOptions = async (req: Request, res: Response) => {
  try {
    const organization = await resolveOrgFromHeader(req);
    if (!organization) {
      return res
        .status(400)
        .json({ message: "Organization not found. Invalid X-Org-Slug header." });
    }

    const skills = await skillRepository.find({
      where: { org_id: organization.id, deleted_at: IsNull() },
      select: ["id", "name"],
      order: { name: "ASC" },
    });

    const industries = await industryRepository.find({
      where: { org_id: organization.id, deleted_at: IsNull() },
      select: ["id", "industry"],
      order: { industry: "ASC" },
    });

    return res.status(200).json({
      message: "Filter options fetched successfully",
      data: {
        skills,
        industries: industries.map((i) => ({
          value: String(i.id),
          label: i.industry,
        })),
      },
    });
  } catch (error: any) {
    console.error("Portal filter options error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * GET /api/portal/jobs/org-info
 * Returns lightweight org info (id, name, slug) resolved from X-Org-Slug header.
 */
export const getPortalOrgInfo = async (req: Request, res: Response) => {
  try {
    const organization = await resolveOrgFromHeader(req);
    if (!organization) {
      return res
        .status(400)
        .json({ message: "Organization not found. Invalid X-Org-Slug header." });
    }

    let logo_url: string | null = null;
    if (organization.has_logo) {
      try {
        const { getOrgLogoSignedUrl } = await import("../../utility/s3");
        logo_url = await getOrgLogoSignedUrl(organization.id);
      } catch {
        logo_url = null;
      }
    }

    return res.status(200).json({
      message: "Organization info fetched successfully",
      data: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        tagline: organization.tagline,
        address: organization.address,
        logo_url,
        social_x: organization.social_x,
        social_facebook: organization.social_facebook,
        social_instagram: organization.social_instagram,
        social_linkedin: organization.social_linkedin,
        social_youtube: organization.social_youtube,
        social_whatsapp: organization.social_whatsapp,
      },
    });
  } catch (error: any) {
    console.error("Portal org info error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * GET /api/portal/jobs/skills
 * Paginated skill list for PMultiSelect dropdown.
 */
export const getPortalSkills = async (req: Request, res: Response) => {
  try {
    const organization = await resolveOrgFromHeader(req);
    if (!organization) {
      return res
        .status(400)
        .json({ message: "Organization not found. Invalid X-Org-Slug header." });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = (req.query.search as string) || "";

    const where: Record<string, any> = {
      org_id: organization.id,
      deleted_at: IsNull(),
    };

    if (search.trim()) {
      where.lower_name = Like(`%${search.trim().toLowerCase()}%`);
    }

    const [skills, total] = await skillRepository.findAndCount({
      where,
      select: ["id", "name"],
      order: { name: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      message: "Skills fetched successfully",
      data: skills.map((s) => ({ value: String(s.id), label: s.name })),
      isLast: page >= totalPages,
      total,
      totalPages,
    });
  } catch (error: any) {
    console.error("Portal skills error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
