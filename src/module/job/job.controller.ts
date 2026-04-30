import { Request, Response } from "express";
import * as jobService from "./job.services";
import * as jobSkillService from "../job-skills/job-skill.services";
import * as questionService from "../questions/question.services";
import * as submissionStatusService from "../submission-statuses/submission-status.services";
import { CreateJobPostInput, QuestionInput } from "./job.type";
import { IsNull } from "typeorm";
import { getJobSourceLinks, getRecruiterSourceLinks } from "../../utility/jobUrl";
import { getUserUuidId, getUser } from "../users/user.services";
import { getJobNotesWithCreator } from "../job-notes/job-note.controller";
import { getBranchByIdAndOrg } from "../branches/branch.services";
import { getProfilePhotoSignedUrl } from "../../utility/s3";
import { getAIResponse } from "../ai/ai.services";
import { addJobIndex, removeJobIndex, toggleJobPublished as toggleJobPublishedES } from "../../elastic-index/job/job.operation";
import { generatePrefixedId } from "../../utility/uniqueid";
import { StatusType } from "../submission-statuses/submission-status.model";
import { canUserAccessJob } from "../../utility/check-job-access";

export const createJob = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { skills, questions, ...jobData } = req.body;

        const input: CreateJobPostInput = {
            ...jobData,
            org_id,
            unique_job_id: generatePrefixedId("JOB"),
            owner_user_id: jobData.owner_user_id ?? user_id,
            created_by: user_id,
            updated_by: null,
            deleted_by: null,
        };

        const job = await jobService.createJobPost(input);

        // Add skills to job_skills table
        if (skills && Array.isArray(skills) && skills.length > 0) {
            const skillPromises = skills.map((skillId: number) =>
                jobSkillService.createJobPostSkill({
                    org_id,
                    job_post_id: job.id,
                    skill_id: skillId,
                })
            );
            await Promise.all(skillPromises);
        }

        // Create default submission statuses for this job
        const defaultStatuses = [
            { name: "Longlist", order: 0, status_type: StatusType.LONGLIST },
            { name: "Applicants", order: 1, status_type: StatusType.APPLICATION },
            { name: "Interview", order: 3, status_type: StatusType.INTERVIEW },
            { name: "Rejected", order: 4, status_type: StatusType.REJECTED },
            { name: "Joined", order: 5, status_type: StatusType.JOINED },
        ];
        await submissionStatusService.createMultipleSubmissionStatuses(
            defaultStatuses.map((s) => ({
                org_id,
                job_id: job.id,
                name: s.name,
                order: s.order,
                status_type: s.status_type,
                created_by: user_id,
                updated_by: null,
                deleted_by: null,
            }))
        );

        // Add screening questions
        if (questions && Array.isArray(questions) && questions.length > 0) {
            const questionPromises = questions
                .filter((q: QuestionInput) => !q.isDeleted && q.question_text && !q.question_text.startsWith("--delete--"))
                .map((q: QuestionInput, index: number) =>
                    questionService.createQuestion({
                        org_id,
                        job_post_id: job.id,
                        question_text: q.question_text,
                        description: q.description || null,
                        question_type: q.question_type,
                        options: q.options || null,
                        is_required: q.is_required || false,
                        order: q.order ?? index,
                        created_by: user_id,
                        updated_by: null,
                        deleted_by: null,
                    })
                );
            await Promise.all(questionPromises);
        }

        // importent add in job index after create job
        await addJobIndex(job.id, org_id)

        return res.status(201).json({
            message: "Job created successfully",
            data: job
        });
    } catch (error: any) {
        console.error("Error creating job:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

export const getJobs = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const {
            limit = 20, search_after, search, project_id, no_project,
            skillIds, industryId, job_type, status, remote_status,
            city, state, country, unique_job_id, owner_user_id, created_by_id,
            ctc_min, ctc_max, include_closed,
        } = req.query;

        // Parse skillIds (comma-separated list of skill IDs)
        const parsedSkillIds = skillIds
            ? (skillIds as string).split(",").map((s) => parseInt(s.trim())).filter(n => !isNaN(n))
            : undefined;

        // Determine status filter:
        // 1. Explicit status param takes priority
        // 2. include_closed=true → show Active + Closed
        // 3. Default → show only Active
        let resolvedStatus: string | string[] | undefined;
        if (status) {
            resolvedStatus = status as string;
        } else if (include_closed === "true") {
            resolvedStatus = ["Active", "Closed"];
        } else {
            resolvedStatus = "Active";
        }

        const recruiterUuidId = await getUserUuidId(user_id, org_id);

        // Parse search_after cursor from comma-separated query param
        const parsedSearchAfter = search_after
            ? (search_after as string).split(",").map((v) => {
                const num = Number(v);
                return isNaN(num) ? v : num;
            })
            : undefined;

        const result = await jobService.getJobsList(
            org_id,
            {
                search_after: parsedSearchAfter,
                limit: Number(limit),
                search: search as string,
                project_id: project_id ? Number(project_id) : undefined,
                no_project: no_project === "true",
                filters: {
                    skillIds: parsedSkillIds && parsedSkillIds.length > 0 ? parsedSkillIds : undefined,
                    industryId: industryId ? parseInt(industryId as string) : undefined,
                    job_type: job_type as string || undefined,
                    status: resolvedStatus,
                    remote_status: remote_status as string || undefined,
                    city: city as string || undefined,
                    state: state as string || undefined,
                    country: country as string || undefined,
                    unique_job_id: unique_job_id as string || undefined,
                    owner_user_id: owner_user_id ? parseInt(owner_user_id as string) : undefined,
                    created_by_id: created_by_id ? parseInt(created_by_id as string) : undefined,
                    ctc_min: ctc_min ? parseFloat(ctc_min as string) : undefined,
                    ctc_max: ctc_max ? parseFloat(ctc_max as string) : undefined,
                },
            },
            recruiterUuidId
        );

        return res.status(200).json({
            message: "Jobs fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error("Error fetching jobs:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

export const getJob = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;

        const job = await jobService.getJobPostWithProject({
            id,
            org_id,
            deleted_at: IsNull()
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Get skills for this job in {value, label} format
        const skills = await jobSkillService.getJobPostSkillsWithNames(id, org_id);

        // Format project as {value, label}
        const project = job.project
            ? { id: String(job.project.id), name: job.project.name }
            : null;

        // Get client info from project
        let client_id: number | null = null;
        let client_name: string | null = null;
        if (job.project_id) {
            const clientInfo = await jobService.getClientNameByProjectId(job.project_id, org_id);
            client_id = clientInfo.client_id;
            client_name = clientInfo.client_name;
        }

        // Get industry in {value, label} format
        const industry = job.industry_id
            ? await jobService.getIndustryById(job.industry_id, org_id)
            : null;

        // Get screening questions
        const questions = await questionService.getQuestionsByJobId(id, org_id);

        // Get submission statuses for this job
        const submissionStatuses = await submissionStatusService.getSubmissionStatusesByJobId(id, org_id);

        // Get source links for this job
        const sourceLinks = await getJobSourceLinks(org_id, id);

        // Generate recruiter-specific links with utm_cin
        let recruiterSourceLinks: Record<string, string> | null = null;
        const recruiterUuidId = await getUserUuidId(user_id, org_id);
        if (recruiterUuidId && Object.keys(sourceLinks).length > 0) {
            recruiterSourceLinks = getRecruiterSourceLinks(sourceLinks, recruiterUuidId);
        }

        // Get notes for this job
        const notes = await getJobNotesWithCreator(id, org_id);

        // Resolve owner name
        let owner_name: string | null = null;
        if (job.owner_user_id) {
            const ownerUser = await getUser({ id: job.owner_user_id, org_id });
            if (ownerUser) {
                owner_name = `${ownerUser.first_name || ""} ${ownerUser.last_name || ""}`.trim() || null;
            }
        }

        // Resolve branch name
        let branch_name: string | null = null;
        if (job.branch_id) {
            const branch = await getBranchByIdAndOrg(job.branch_id, org_id);
            if (branch) {
                branch_name = branch.branch_name;
            }
        }

        // Helper: resolve a signed photo URL, swallow errors
        const resolveUserPhoto = async (id: number): Promise<string | null> => {
            try {
                return (await getProfilePhotoSignedUrl(id)) || null;
            } catch {
                return null;
            }
        };

        // Resolve contact person as {value, label, image}
        let contact_person: { value: string; label: string; image: string | null } | null = null;
        let contact_person_name: string | null = null;
        if (job.contact_person_id) {
            const contactPerson = await getUser({ id: job.contact_person_id, org_id });
            if (contactPerson) {
                const label = `${contactPerson.first_name || ""} ${contactPerson.last_name || ""}`.trim() || contactPerson.email;
                contact_person_name = label || null;
                contact_person = {
                    value: String(contactPerson.id),
                    label,
                    image: await resolveUserPhoto(contactPerson.id),
                };
            }
        }

        // Resolve assignees as {value, label, image} array
        const assignees: { value: string; label: string; image: string | null }[] = [];
        if (job.assignee_ids && job.assignee_ids.length > 0) {
            for (const uid of job.assignee_ids) {
                const user = await getUser({ id: uid, org_id });
                if (user) {
                    assignees.push({
                        value: String(user.id),
                        label: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
                        image: await resolveUserPhoto(user.id),
                    });
                }
            }
        }

        // Resolve interviewer as {value, label, image}
        let interviewer: { value: string; label: string; image: string | null } | null = null;
        let interviewer_name: string | null = null;
        if (job.interviewer_id) {
            const interviewerUser = await getUser({ id: job.interviewer_id, org_id });
            if (interviewerUser) {
                const label = `${interviewerUser.first_name || ""} ${interviewerUser.last_name || ""}`.trim() || interviewerUser.email;
                interviewer_name = label || null;
                interviewer = {
                    value: String(interviewerUser.id),
                    label,
                    image: await resolveUserPhoto(interviewerUser.id),
                };
            }
        }

        // Check if user can act on this job (add candidates, move status, send emails, etc.)
        const can_act = await canUserAccessJob(req, org_id, id);

        return res.status(200).json({
            message: "Job fetched successfully",
            data: {
                ...job,
                skills,
                project,
                industry,
                questions,
                submissionStatuses,
                sourceLinks,
                recruiterSourceLinks,
                notes,
                owner_name,
                client_id,
                client_name,
                branch_name,
                contact_person_name,
                contact_person,
                assignees,
                interviewer_name,
                interviewer,
                can_act,
            },
        });
    } catch (error: any) {
        console.error("Error fetching job:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

export const updateJob = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;
        const { skills, questions, ...updateData } = req.body;

        const job = await jobService.getJobPost({
            id,
            org_id,
            deleted_at: IsNull()
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        updateData.updated_by = user_id;
        await jobService.updateJobPost({ id }, job, updateData);

        // Update skills if provided
        if (skills && Array.isArray(skills)) {
            // Remove existing skills
            await jobSkillService.deleteJobPostSkill({ job_post_id: id, org_id });

            // Add new skills
            const skillPromises = skills.map((skillId: number) =>
                jobSkillService.createJobPostSkill({
                    org_id,
                    job_post_id: id,
                    skill_id: skillId,
                })
            );
            await Promise.all(skillPromises);
        }

        if (questions && Array.isArray(questions)) {
            for (const q of questions as QuestionInput[]) {
                if (q.id && (q.isDeleted || q.question_text?.startsWith("--delete--"))) {
                    await questionService.deleteQuestion({ id: q.id, org_id }, user_id);
                } else if (q.id && !q.isDeleted) {
                    await questionService.updateQuestion(
                        { id: q.id, org_id },
                        {
                            question_text: q.question_text,
                            description: q.description || null,
                            question_type: q.question_type,
                            options: q.options || null,
                            is_required: q.is_required,
                            order: q.order,
                            updated_by: user_id,
                        }
                    );
                } else if (!q.id && !q.isDeleted && q.question_text) {
                    await questionService.createQuestion({
                        org_id,
                        job_post_id: id,
                        question_text: q.question_text,
                        description: q.description || null,
                        question_type: q.question_type,
                        options: q.options || null,
                        is_required: q.is_required || false,
                        order: q.order ?? 0,
                        created_by: user_id,
                        updated_by: null,
                        deleted_by: null,
                    });
                }
            }
        }

        // importent add in job index after update job
        await addJobIndex(job.id, org_id)

        return res.status(200).json({ message: "Job updated successfully" });
    } catch (error: any) {
        console.error("Error updating job:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

export const generateJobDescription = async (req: Request, res: Response) => {
    try {
        const { job_title, experience, job_type, remote_status, skills, description } = req.body;

        const prompt = buildJDPrompt({
            job_title: job_title || "Job Title",
            experience: experience || "0",
            job_type: job_type || "Full-time",
            remote_status: remote_status || "On-site",
            skills: Array.isArray(skills) ? skills : [],
            description: description || "",
        });

        const aiResponse = await getAIResponse({ prompt, maxTokens: 2048, temperature: 0.7 });

        if (!aiResponse.success) {
            return res.status(500).json({
                error: "AI generation failed",
                details: aiResponse.content,
            });
        }

        return res.status(200).json({
            message: "Job description generated successfully",
            data: { markdown: aiResponse.content },
        });
    } catch (error: any) {
        console.error("Error generating job description:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};

export const deleteJob = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;

        const job = await jobService.getJobPost({
            id,
            org_id,
            deleted_at: IsNull()
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Soft delete
        await jobService.deleteJobPost(
            { id },
            { deleted_at: new Date(), deleted_by: user_id }
        );

        // importent remove in job index after delete job
        await removeJobIndex(job.id)

        return res.status(200).json({ message: "Job deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting job:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

export const toggleJobPublished = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;
        const { published } = req.body;

        const job = await jobService.getJobPost({
            id,
            org_id,
            deleted_at: IsNull()
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        await jobService.updateMultipleJobPosts({ id, org_id }, { published, updated_by: user_id });
        await toggleJobPublishedES(id, org_id, published);

        return res.status(200).json({
            message: published ? "Job published to portal" : "Job unpublished from portal",
            data: { published },
        });
    } catch (error: any) {
        console.error("Error toggling job published:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};

// Builds the AI prompt from structured job data
const buildJDPrompt = (jobData: {
    job_title: string;
    experience: string;
    job_type: string;
    remote_status: string;
    skills: string[];
    description: string;
}): string => {
    return `
You are an expert HR copywriter. Convert the following job data into a professional, detailed Job Description (JD).

Job Data:
- Job Title: ${jobData.job_title}
- Experience Required: ${jobData.experience} years
- Job Type: ${jobData.job_type}
- Work Mode: ${jobData.remote_status}
- Key Skills: ${jobData.skills.join(", ")}
- Job Description/Context: ${jobData.description}

Generate a full Job Description using proper Markdown formatting. Structure it with the following sections. don't add job title at top:

## Job Summary
Write 3-4 engaging sentences summarizing the role, its impact, and what makes it exciting.

## Key Responsibilities
Based on the job description/context, generate detailed, professional responsibility bullet points using action verbs.
Format each as: "• <responsibility>"

## Required Skills and Qualifications
Based on the job description/context, generate detailed requirement bullet points.
Include the experience requirement.
Format each as: "• <requirement>"

## Preferred Qualifications
Generate 3-4 relevant preferred qualifications.
Format each as: "• <qualification>"

Formatting Rules:
- Use "## Section Name" for all section headings
- Use "• " (bullet + space) for every list item
- Use **bold** for emphasis on key terms
- Output ONLY valid Markdown — no plain text, no extra commentary outside the JD
    `.trim();
};
