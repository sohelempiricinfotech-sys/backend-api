import { JobPost } from "./job.model";
import { AppDataSource } from "../../data-source";
import { CreateJobPostInput, UpdateJobPostInput, JobStatus } from "./job.type";
import { Industry } from "../industries/industry.model";
import { Client } from "../clients/client.model";
import { IsNull } from "typeorm";
import { searchJobs, type JobFilterOptions } from "../../elastic-index/job/job.get";
import { getProfilePhotoSignedUrl } from "../../utility/s3";
import { getOrganization } from "../organizations/organization.services";
import { getSources } from "../sources/source.services";
import { Project } from "../projects/projects.model";

const clientRepository = AppDataSource.getRepository(Client);
const projectRepo = AppDataSource.getRepository(Project);
const jobPostRepository = AppDataSource.getRepository(JobPost);
const industryRepository = AppDataSource.getRepository(Industry);

const updateMultipleJobPosts = async (
  filter: object,
  update: object
) => {
  return await jobPostRepository.update(filter, update);
};

const createJobPost = async (data: CreateJobPostInput) => {
  console.log("Creating job post with data (DB call):", data);
  const newJobPost = jobPostRepository.create(data);
  return jobPostRepository.save(newJobPost);
};

const getJobPosts = async (filter: object) => {
  return jobPostRepository.findBy(filter);
};

const deleteJobPost = async (filter: object, update: object) => {
  return jobPostRepository.update(filter, update);
};

const updateJobPost = async (
  filter: object,
  data: JobPost,
  jobPostData: UpdateJobPostInput
) => {
  const newData = jobPostRepository.merge(data, jobPostData);
  const updatedJobPost = await jobPostRepository.save(newData);
  return await jobPostRepository.update(filter, updatedJobPost);
};

const getJobPost = async (filter: object) => {
  console.log("Fetching job post with filter (DB call):", filter);
  return await jobPostRepository.findOneBy(filter);
};

const getJobPostWithProject = async (filter: {
  id: string;
  org_id: number;
  deleted_at: any;
}) => {
  return await jobPostRepository
    .createQueryBuilder("job")
    .leftJoinAndSelect("job.project", "project", "project.id = job.project_id AND project.org_id = job.org_id")
    .where("job.id = :id", { id: filter.id })
    .andWhere("job.org_id = :org_id", { org_id: filter.org_id })
    .andWhere("job.deleted_at IS NULL")
    .getOne();
};

const getClientNameByProjectId = async (projectId: number, orgId: number): Promise<{ client_id: number | null; client_name: string | null }> => {
  try {
    const project = await projectRepo.findOne({
      where: { id: projectId, org_id: orgId, deleted_at: IsNull() },
      select: ["client_id"],
    });
    if (project?.client_id) {
      const client = await clientRepository.findOne({
        where: { id: project.client_id, org_id: orgId, deleted_at: IsNull() },
        select: ["id", "client_name"],
      });
      if (client) return { client_id: client.id, client_name: client.client_name };
    }
  } catch { }
  return { client_id: null, client_name: null };
};

const getJobsList = async (
  orgId: number,
  options: {
    limit: number;
    search_after?: (string | number)[];
    search?: string;
    project_id?: number;
    no_project?: boolean;
    select?: string[];
    filters?: {
      skillIds?: number[];
      industryId?: number;
      job_type?: string;
      status?: string | string[];
      remote_status?: string;
      city?: string;
      state?: string;
      country?: string;
      unique_job_id?: string;
      owner_user_id?: number;
      created_by_id?: number;
      ctc_min?: number;
      ctc_max?: number;
      experience_min?: number;
      experience_max?: number;
      published?: boolean;
    };
  },
  recruiterUuidId?: string | null
) => {
  const { limit, search_after, search, project_id, no_project, filters } = options;

  const esOptions: JobFilterOptions = {
    org_id: orgId,
    search_after,
    limit,
    search: search || undefined,
    project_id: project_id || undefined,
    no_project: no_project || undefined,
    skill_ids: filters?.skillIds?.length ? filters.skillIds : undefined,
    industry_id: filters?.industryId || undefined,
    job_type: filters?.job_type || undefined,
    status: filters?.status || undefined,
    remote_status: filters?.remote_status || undefined,
    city: filters?.city || undefined,
    state: filters?.state || undefined,
    country: filters?.country || undefined,
    unique_job_id: filters?.unique_job_id || undefined,
    owner_user_id: filters?.owner_user_id || undefined,
    created_by_id: filters?.created_by_id || undefined,
    ctc_min: filters?.ctc_min,
    ctc_max: filters?.ctc_max,
    experience_min: filters?.experience_min,
    experience_max: filters?.experience_max,
    published: filters?.published,
  };

  const result = await searchJobs(esOptions);

  // Fetch org slug + sources once for generating source links
  const CAREER_PORTAL_DOMAIN = process.env.CAREER_PORTAL_DOMAIN || "careers.tekpillar.com";
  const CAREER_SECURE = process.env.CAREER_SECURE || "false";
  const protocol = CAREER_SECURE === "true" ? "https" : "http";

  let orgSlug: string | null = null;
  let sourcesData: { source: string }[] = [];
  try {
    const org = await getOrganization({ id: orgId });
    if (org) {
      orgSlug = org.slug;
      sourcesData = await getSources({ org_id: orgId });
    }
  } catch {
    // If org/sources fetch fails, skip source links
  }

  // Map ES documents to the expected response shape
  const esResult = result as { data: any[]; total: number; hasMore: boolean; last_sort: (string | number)[] | null };

  // Fetch note counts in one PG query for all jobs in this page
  const jobIds = esResult.data.map((d) => d.id).filter((id): id is string => !!id);
  const noteCountByJobId = new Map<string, number>();
  if (jobIds.length > 0) {
    const counts = await AppDataSource
      .createQueryBuilder()
      .select("n.job_id", "job_id")
      .addSelect("COUNT(*)", "count")
      .from("job_notes", "n")
      .where("n.job_id IN (:...jobIds)", { jobIds })
      .andWhere("n.org_id = :org_id", { org_id: orgId })
      .andWhere("n.deleted_at IS NULL")
      .groupBy("n.job_id")
      .getRawMany();
    for (const row of counts) {
      noteCountByJobId.set(String(row.job_id), parseInt(row.count, 10));
    }
  }

  const jobs = await Promise.all(
    esResult.data.map(async (doc: any) => {
      let created_by_profile_photo_url: string | null = null;
      try {
        if (doc.created_by_id) created_by_profile_photo_url = await getProfilePhotoSignedUrl(doc.created_by_id);
      } catch {
        created_by_profile_photo_url = null;
      }

      // Generate source links for this job
      let sourceLinks: Record<string, string> | null = null;
      let recruiterSourceLinks: Record<string, string> | null = null;
      if (orgSlug) {
        const baseUrl = `${protocol}://${orgSlug}.${CAREER_PORTAL_DOMAIN}/job/${doc.id}`;
        sourceLinks = { Default: baseUrl };
        for (const src of sourcesData) {
          const utmSource = src.source.toLowerCase().replace(/\s+/g, "_");
          sourceLinks[src.source] = `${baseUrl}?utm_source=${utmSource}`;
        }

        // Generate recruiter-specific links with utm_cin
        if (recruiterUuidId) {
          recruiterSourceLinks = {};
          recruiterSourceLinks["Default"] = `${baseUrl}?utm_cin=${recruiterUuidId}`;
          for (const src of sourcesData) {
            const utmSource = src.source.toLowerCase().replace(/\s+/g, "_");
            recruiterSourceLinks[src.source] = `${baseUrl}?utm_source=${utmSource}&utm_cin=${recruiterUuidId}`;
          }
        }
      }

      // Get client info from project
      let client_id: number | null = null;
      let client_name: string | null = null;
      if (doc.project_id) {
        const clientInfo = await getClientNameByProjectId(doc.project_id, orgId);
        client_id = clientInfo.client_id;
        client_name = clientInfo.client_name;
      }

      return {
        ...doc,
        number_of_positions: doc.positions != null ? String(doc.positions) : null,
        experience: doc.experience != null ? String(doc.experience) : null,
        project: doc.project_id
          ? { id: String(doc.project_id), name: doc.project_name || null }
          : null,
        client_id,
        client_name,
        created_by_profile_photo_url,
        sourceLinks,
        recruiterSourceLinks,
        note_count: doc.id ? (noteCountByJobId.get(String(doc.id)) ?? 0) : 0,
      };
    })
  );

  return { jobs, total: esResult.total, hasMore: esResult.hasMore, last_sort: esResult.last_sort };
};

const getIndustryById = async (industryId: number, orgId: number) => {
  const industry = await industryRepository.findOne({
    where: { id: industryId, org_id: orgId, deleted_at: IsNull() },
  });
  if (industry) {
    return { value: String(industry.id), label: industry.industry };
  }
  return null;
};

export {
  updateMultipleJobPosts,
  createJobPost,
  getJobPosts,
  getJobsList,
  deleteJobPost,
  updateJobPost,
  getJobPost,
  getJobPostWithProject,
  getIndustryById,
  getClientNameByProjectId,
};
