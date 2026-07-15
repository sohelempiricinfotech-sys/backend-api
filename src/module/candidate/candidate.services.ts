import { AppDataSource } from "../../data-source";
import { User, SystemRole } from "../users/user.model";
import { CandidateData } from "../candidate-data/candidate-data.model";
import { CandidateSkill } from "../candidate-skills/candidate-skill.model";
import { Skill } from "../skills/skill.model";
import { Industry } from "../industries/industry.model";
import { Experience } from "../experience/experience.model";
import { UserMetadata } from "../user-metadata/user-metadata.model";
import { IsNull } from "typeorm";
import { CreateCandidateDataInput } from "../candidate-data/candidate-data.type";
import { CreateCandidateSkillInput } from "../candidate-skills/candidate-skill.type";
import { getResumes } from "../resumes/resume.services";
import { getFileUrl, getProfilePhotoSignedUrl } from "../../utility/s3";
import { Submission } from "../submissions/submission.model";
import { JobPost } from "../job/job.model";
import { SubmissionStatus } from "../submission-statuses/submission-status.model";
import { searchCandidates } from "../../elastic-index/candidate/candidate.get";
import { CandidateDocument } from "../../elastic-index/candidate/candidate.mapping";

const calculateAge = (dob: string | null): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const experienceRepository = AppDataSource.getRepository(Experience);
const userMetadataRepository = AppDataSource.getRepository(UserMetadata);

const userRepository = AppDataSource.getRepository(User);
const candidateDataRepository = AppDataSource.getRepository(CandidateData);
const candidateSkillRepository = AppDataSource.getRepository(CandidateSkill);
const industryRepository = AppDataSource.getRepository(Industry);

interface GetCandidatesOptions {
    limit: number;
    search_after?: (string | number)[];
    search?: string;
    // Filters
    skillIds?: number[];
    industryId?: number;
    minExperience?: number;
    maxExperience?: number;
    gender?: string;
    city?: string;
    state?: string;
    country?: string;
    status?: string;
    noticePeriodMin?: number;
    noticePeriodMax?: number;
    uniqueId?: string;
    createdById?: number;
    updatedById?: number;
    lastActivityFrom?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
}

export const createCandidateData = async (data: CreateCandidateDataInput) => {
    console.log("Creating candidate data with data (DB call):", data);
    const newCandidateData = candidateDataRepository.create(data);
    return candidateDataRepository.save(newCandidateData);
};

export const createCandidateSkill = async (data: CreateCandidateSkillInput) => {
    console.log("Creating candidate skill with data (DB call):", data);
    const newCandidateSkill = candidateSkillRepository.create(data);
    return candidateSkillRepository.save(newCandidateSkill);
};

export const getCandidates = async (org_id: number, options: GetCandidatesOptions) => {
    const pageLimit = Math.min(Math.max(options.limit, 1), 100);
    const result = await searchCandidates({
        org_id,
        search: options.search,
        skill_ids: options.skillIds,
        industry_id: options.industryId,
        gender: options.gender,
        experience_years_min: options.minExperience,
        experience_years_max: options.maxExperience,
        city: options.city,
        state: options.state,
        country: options.country,
        status: options.status,
        notice_period_min: options.noticePeriodMin,
        notice_period_max: options.noticePeriodMax,
        unique_id: options.uniqueId,
        created_by_id: options.createdById,
        updated_by_id: options.updatedById,
        last_activity_min: options.lastActivityFrom,
        search_after: options.search_after,
        limit: pageLimit,
        sort_by: options.sort_by,
        sort_order: options.sort_order,
    });

    const esResult = result as { data: CandidateDocument[]; total: number; hasMore: boolean; last_sort: (string | number)[] | null };

    // Fetch note counts in one PG query for all candidates in this page
    const candidateIds = esResult.data.map((d) => d.id).filter((id): id is number => id != null);
    const noteCountByCandidateId = new Map<number, number>();
    if (candidateIds.length > 0) {
        const counts = await AppDataSource
            .createQueryBuilder()
            .select("n.user_id", "user_id")
            .addSelect("COUNT(*)", "count")
            .from("user_notes", "n")
            .where("n.user_id IN (:...candidateIds)", { candidateIds })
            .andWhere("n.org_id = :org_id", { org_id })
            .andWhere("n.deleted_at IS NULL")
            .groupBy("n.user_id")
            .getRawMany();
        for (const row of counts) {
            noteCountByCandidateId.set(parseInt(row.user_id, 10), parseInt(row.count, 10));
        }
    }

    // Map ES documents to response shape matching frontend expectations
    const candidates = await Promise.all(
        esResult.data.map(async (doc) => {
            const [firstName, ...rest] = (doc.full_name || "").split(" ");

            let profile_photo_url: string | null = null;
            try {
                if (doc.id) profile_photo_url = await getProfilePhotoSignedUrl(doc.id);
            } catch {
                profile_photo_url = null;
            }

            let created_by_profile_photo_url: string | null = null;
            try {
                if (doc.created_by_id) created_by_profile_photo_url = await getProfilePhotoSignedUrl(doc.created_by_id);
            } catch {
                created_by_profile_photo_url = null;
            }

            let updated_by_profile_photo_url: string | null = null;
            try {
                if (doc.updated_by_id) updated_by_profile_photo_url = await getProfilePhotoSignedUrl(doc.updated_by_id);
            } catch {
                updated_by_profile_photo_url = null;
            }

            return {
                id: doc.id,
                unique_id: doc.unique_id,
                first_name: firstName || "",
                last_name: rest.join(" ") || "",
                email: doc.email,
                phone: doc.phone,
                profile_photo_url,
                designation: doc.designation,
                experience_years: doc.experience_years,
                notice_period: doc.notice_period,
                gender: doc.gender,
                linkedin_url: doc.linkedin_url,
                industry_id: doc.industry_id,
                industry_name: doc.industry_name,
                skills: doc.skill_names,
                date_of_birth: doc.date_of_birth,
                age: calculateAge(doc.date_of_birth),
                city: doc.city,
                state: doc.state,
                country: doc.country,
                status: doc.status,
                joined: doc.joined ?? false,
                email_send_count: doc.email_send_count,
                note_count: doc.id != null ? (noteCountByCandidateId.get(doc.id) ?? 0) : 0,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
                created_by_id: doc.created_by_id,
                created_by_name: doc.created_by_name,
                created_by_profile_photo_url,
                updated_by_id: doc.updated_by_id,
                updated_by_name: doc.updated_by_name,
                updated_by_profile_photo_url,
            };
        })
    );

    return {
        candidates,
        total: esResult.total,
        hasMore: esResult.hasMore,
        last_sort: esResult.last_sort,
    };
};

const CSV_BATCH_SIZE = 100;

const CSV_COLUMNS = [
    { header: "Candidate ID", key: "unique_id" },
    { header: "Name", key: "full_name" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Designation", key: "designation" },
    { header: "Experience (Years)", key: "experience_years" },
    { header: "Notice Period", key: "notice_period" },
    { header: "Gender", key: "gender" },
    { header: "Age", key: "age" },
    { header: "Skills", key: "skills" },
    { header: "Industry", key: "industry_name" },
    { header: "City", key: "city" },
    { header: "State", key: "state" },
    { header: "Country", key: "country" },
    // { header: "Status", key: "status" },
    { header: "LinkedIn", key: "linkedin_url" },
    { header: "Created By", key: "created_by_name" },
    { header: "Created At", key: "created_at" },
] as const;

const escapeCsvField = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

const formatPhone = (phone: string | null): string => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    if (digits.length === 12) return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
    if (digits.length === 11) return `+${digits.slice(0, 1)} ${digits.slice(1, 6)} ${digits.slice(6)}`;
    return phone;
};

const formatCsvDate = (dateString: string | null): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const getCandidatesCsvFromES = async (org_id: number, options: Omit<GetCandidatesOptions, "limit" | "search_after">): Promise<string> => {
    const headerRow = CSV_COLUMNS.map((c) => c.header).join(",");
    const rows: string[] = [headerRow];

    let hasMore = true;
    let searchAfter: (string | number)[] | undefined;

    while (hasMore) {
        const result = await searchCandidates({
            org_id,
            search: options.search,
            skill_ids: options.skillIds,
            industry_id: options.industryId,
            gender: options.gender,
            experience_years_min: options.minExperience,
            experience_years_max: options.maxExperience,
            city: options.city,
            state: options.state,
            country: options.country,
            status: options.status,
            notice_period_min: options.noticePeriodMin,
            notice_period_max: options.noticePeriodMax,
            unique_id: options.uniqueId,
            created_by_id: options.createdById,
            updated_by_id: options.updatedById,
            last_activity_min: options.lastActivityFrom,
            search_after: searchAfter,
            limit: CSV_BATCH_SIZE,
        });

        const esResult = result as { data: CandidateDocument[]; total: number; hasMore: boolean; last_sort: (string | number)[] | null };

        for (const doc of esResult.data) {
            const record: Record<string, unknown> = {
                unique_id: doc.unique_id,
                full_name: doc.full_name,
                email: doc.email,
                phone: formatPhone(doc.phone),
                designation: doc.designation,
                experience_years: doc.experience_years,
                notice_period: doc.notice_period,
                gender: doc.gender,
                age: calculateAge(doc.date_of_birth),
                skills: doc.skill_names?.join("; "),
                industry_name: doc.industry_name,
                city: doc.city,
                state: doc.state,
                country: doc.country,
                status: doc.status,
                linkedin_url: doc.linkedin_url,
                created_by_name: doc.created_by_name,
                created_at: formatCsvDate(doc.created_at),
            };

            const row = CSV_COLUMNS.map((col) => escapeCsvField(record[col.key])).join(",");
            rows.push(row);
        }

        hasMore = esResult.hasMore;
        searchAfter = esResult.last_sort ?? undefined;
    }

    return rows.join("\n");
};

export const getCandidateById = async (id: number, org_id: number) => {
    const user = await userRepository.findOne({
        where: {
            id,
            org_id,
            system_role: SystemRole.CANDIDATE,
            deleted_at: IsNull(),
        },
    });

    if (!user) return null;

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    // Generate signed URL for profile photo from userId
    let profile_photo_url: string | null = null;
    try {
        profile_photo_url = await getProfilePhotoSignedUrl(id);
    } catch {
        profile_photo_url = null;
    }

    const candidateData = await candidateDataRepository.findOne({
        where: { user_id: id, org_id },
    });

    const candidateSkills = await candidateSkillRepository
        .createQueryBuilder("cs")
        .leftJoinAndSelect(Skill, "skill", "skill.id = cs.skill_id AND skill.org_id = cs.org_id")
        .where("cs.user_id = :user_id", { user_id: id })
        .andWhere("cs.org_id = :org_id", { org_id })
        .select(["cs.skill_id as value", "skill.name as label"])
        .getRawMany();

    // Get industry if exists
    let industry = null;
    if (candidateData?.industry_id) {
        const industryRecord = await industryRepository.findOne({
            where: { id: candidateData.industry_id, org_id, deleted_at: IsNull() },
        });
        if (industryRecord) {
            industry = { value: String(industryRecord.id), label: industryRecord.industry };
        }
    }

    // Get experiences
    const experiences = await experienceRepository.find({
        where: { user_id: id, org_id, deleted_at: IsNull() },
        order: { start_date: "DESC" },
    });

    // Get user metadata
    const metadata = await userMetadataRepository.findOne({
        where: { user_id: id, org_id, deleted_at: IsNull() },
    });

    // Get resumes with signed URLs
    const resumeRecords = await getResumes({ user_id: id, org_id, deleted_at: IsNull() });
    const resumes = await Promise.all(
        resumeRecords.map(async (resume) => {
            let file_url: string | null = null;
            if (resume.file_path) {
                file_url = await getFileUrl(resume.file_path);
            }
            return {
                id: resume.id,
                file_name: resume.file_name,
                file_path: resume.file_path,
                file_url,
                created_at: resume.created_at,
            };
        })
    );

    // Get submissions (applied jobs) with job title and status name
    const submissionRepository = AppDataSource.getRepository(Submission);
    const submissions = await submissionRepository
        .createQueryBuilder("sub")
        .leftJoin(JobPost, "jp", "jp.id = sub.job_id AND jp.org_id = sub.org_id")
        .leftJoin(SubmissionStatus, "ss", "ss.id = sub.submission_status_id AND ss.org_id = sub.org_id")
        .where("sub.org_id = :org_id", { org_id })
        .andWhere("sub.user_id = :id", { id })
        .andWhere("sub.deleted_at IS NULL")
        .select([
            "sub.id as id",
            "sub.job_id as job_id",
            "jp.job_title as job_title",
            "sub.expected_ctc as expected_ctc",
            "ss.name as status_name",
            "sub.submission_date_at as submission_date_at",
            "sub.created_at as created_at",
        ])
        .orderBy("sub.created_at", "DESC")
        .getRawMany();

    return {
        ...userWithoutPassword,
        profile_photo_url,
        candidate_data: candidateData,
        skills: candidateSkills.map((s: any) => ({ value: String(s.value), label: s.label })),
        industry,
        experiences,
        resumes,
        submissions,
        metadata: metadata ? {
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
        } : null,
    };
};

export const deleteCandidate = async (id: number, org_id: number, deleted_by: number) => {
    return await userRepository.update(
        { id, org_id, system_role: SystemRole.CANDIDATE },
        { deleted_at: new Date(), deleted_by }
    );
};

interface UpdateCandidateData {
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

export const updateCandidate = async (
    id: number,
    org_id: number,
    updated_by: number,
    data: UpdateCandidateData
) => {
    const { skills, ...candidateFields } = data;

    // Update user fields
    const userFields: any = {};
    if (candidateFields.first_name) userFields.first_name = candidateFields.first_name;
    if (candidateFields.last_name) userFields.last_name = candidateFields.last_name;
    if (candidateFields.phone) userFields.phone = candidateFields.phone;
    userFields.updated_by = updated_by;

    if (Object.keys(userFields).length > 1) {
        await userRepository.update(
            { id, org_id, system_role: SystemRole.CANDIDATE },
            userFields
        );
    }

    // Update candidate data
    const candidateDataFields: any = {};
    if (candidateFields.designation !== undefined) candidateDataFields.designation = candidateFields.designation;
    if (candidateFields.experience_years !== undefined) candidateDataFields.experience_years = candidateFields.experience_years;
    if (candidateFields.notice_period !== undefined) candidateDataFields.notice_period = candidateFields.notice_period;
    if (candidateFields.short_summary !== undefined) candidateDataFields.short_summary = candidateFields.short_summary;
    if (candidateFields.objectives !== undefined) candidateDataFields.objectives = candidateFields.objectives;
    if (candidateFields.industry_id !== undefined) candidateDataFields.industry_id = candidateFields.industry_id;
    if (candidateFields.linkedin_url !== undefined) candidateDataFields.linkedin_url = candidateFields.linkedin_url;
    candidateDataFields.updated_by = updated_by;

    if (Object.keys(candidateDataFields).length > 1) {
        const existingCandidateData = await candidateDataRepository.findOne({
            where: { user_id: id, org_id },
        });

        if (existingCandidateData) {
            await candidateDataRepository.update(
                { user_id: id, org_id },
                candidateDataFields
            );
        } else {
            const newCandidateData = candidateDataRepository.create({
                user_id: id,
                org_id,
                created_by: updated_by,
                ...candidateDataFields,
            });
            await candidateDataRepository.save(newCandidateData);
        }
    }

    // Update skills if provided
    if (skills !== undefined) {
        // Delete existing skills
        await candidateSkillRepository.delete({ user_id: id, org_id });

        // Add new skills
        for (const skillId of skills) {
            const newSkill = candidateSkillRepository.create({
                org_id,
                user_id: id,
                skill_id: skillId,
            });
            await candidateSkillRepository.save(newSkill);
        }
    }

    return await getCandidateById(id, org_id);
};
