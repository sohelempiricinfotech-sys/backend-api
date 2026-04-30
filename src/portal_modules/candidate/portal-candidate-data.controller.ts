import { Request, Response } from "express";
import { AppDataSource } from "../../data-source";
import { Skill } from "../../module/skills/skill.model";
import { Industry } from "../../module/industries/industry.model";
import { IsNull, ILike } from "typeorm";

const skillRepository = AppDataSource.getRepository(Skill);
const industryRepository = AppDataSource.getRepository(Industry);

/**
 * GET /api/portal/candidate/skills
 * Paginated skills list with search for the candidate's org.
 */
export const getPortalSkills = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.portalUser;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = (req.query.search as string) || "";

    const where: any = { org_id, deleted_at: IsNull() };
    if (search.trim()) {
      where.lower_name = ILike(`%${search.trim().toLowerCase()}%`);
    }

    const [skills, total] = await skillRepository.findAndCount({
      where,
      order: { name: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return res.status(200).json({
      message: "Skills fetched successfully.",
      data: skills.map((s) => ({ value: String(s.id), label: s.name })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Portal get skills error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * GET /api/portal/candidate/industries
 * Industries list with search for the candidate's org.
 */
export const getPortalIndustries = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.portalUser;
    const search = (req.query.search as string) || "";

    const where: any = { org_id, deleted_at: IsNull() };
    if (search.trim()) {
      where.industry = ILike(`%${search.trim()}%`);
    }

    const industries = await industryRepository.find({
      where,
      order: { order: "ASC", industry: "ASC" },
    });

    return res.status(200).json({
      message: "Industries fetched successfully.",
      data: industries.map((i) => ({ value: String(i.id), label: i.industry })),
    });
  } catch (error: any) {
    console.error("Portal get industries error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
