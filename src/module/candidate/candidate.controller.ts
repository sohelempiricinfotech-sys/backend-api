import { Request, Response } from "express";
import { createUser } from "../users/user.services";
import { createCandidateType, updateCandidateType, toggleCandidateJoinedSchema } from "./candidate.type";
import { z } from "zod";
import { SystemRole } from "../users/user.model";
import { generateUniqueId } from "../../utility/uniqueid";
import { isUniqueViolation } from "../../utility/unique";
import { createCandidateData } from "./candidate.services";
import { createCandidateSkill, } from "./candidate.services";
import * as candidateService from "./candidate.services";
import { getCandidateNotesWithCreator } from "../user-notes/user-note.controller";
import * as experienceService from "../experience/experience.services";
import * as userMetadataService from "../user-metadata/user-metadata.services";
import { createResume } from "../resumes/resume.services";
import { addCandidateIndex, removeCandidateIndex, updateCandidateJoined } from "../../elastic-index/candidate/candidate.operation";
import { updateSubmissionJoinedByCandidate } from "../../elastic-index/submission/submission.operation";
import { AppDataSource } from "../../data-source";
import { CandidateData } from "../candidate-data/candidate-data.model";
import { reindexByCandidate } from "../../elastic-index/reindex/reindex-candidate";
import { sendEmailToUsers } from "../../utility/send-candidate-email";
import { searchCandidates, CandidateFilterOptions } from "../../elastic-index/candidate/candidate.get";

export const createCandidate = async (req: Request, res: Response) => {
    const { org_id, id: user_id } = req.loginUser.user;
    const candidateData: z.infer<typeof createCandidateType> = req.body;

    try {
        // Create the user with CANDIDATE role
        const candidateUser = await createUser({
            org_id,
            role_id: null,
            unique_id: generateUniqueId(SystemRole.CANDIDATE),
            system_role: SystemRole.CANDIDATE,
            user_detail: {},

            first_name: candidateData.first_name,
            last_name: candidateData.last_name,
            email: candidateData.email,
            phone: candidateData.phone || null,
            password: "",

            oneTimeVerificationCode: null,
            is_password: null,
            is_verified: null,
            status: null,
            access_token: null,
            refresh_token: null,
            two_factor_otp: null,
            otp_expires_at: null,
            login_attempts: null,
            login_attempts_at: null,
            resume_views_by_user: null,
            resume_view_reset_time: null,
            file_download_count: null,
            file_download_reset_time: null,

            profile_photo: null,
            onboard: true,

            created_by: user_id,
            updated_by: null,
            deleted_by: null,
        });

        if (!candidateUser) {
            return res.status(400).json({ message: "Candidate creation failed" });
        }

        console.log(candidateData);


        // Create candidate data record
        await createCandidateData({
            org_id,
            user_id: candidateUser.id,
            designation: candidateData.designation || null,
            experience_years: candidateData.experience_years || null,
            notice_period: candidateData.notice_period || null,
            short_summary: candidateData.short_summary || null,
            objectives: candidateData.objectives || null,
            industry_id: candidateData.industry_id || null,
            linkedin_url: candidateData.linkedin_url || null,
            created_by: user_id,
            deleted_by: null,
            updated_by: null,
            send_mail: false,
            owner_user_id: user_id,
            reference: null,
            resume_content: null,
            status: 0,
        });

        // Create candidate skills if provided
        if (candidateData.skills && candidateData.skills.length > 0) {
            for (const skillId of candidateData.skills) {
                await createCandidateSkill({
                    org_id,
                    user_id: candidateUser.id,
                    skill_id: skillId,
                });
            }
        }

        // Create candidate experiences if provided
        if (candidateData.experiences && candidateData.experiences.length > 0) {
            for (const exp of candidateData.experiences) {
                if (!exp.isDeleted) {
                    await experienceService.createExperience({
                        org_id,
                        user_id: candidateUser.id,
                        job_title: exp.job_title || null,
                        company_name: exp.company_name || null,
                        location: exp.location || null,
                        start_date: exp.start_date ? new Date(exp.start_date) : null,
                        end_date: exp.is_present ? null : (exp.end_date ? new Date(exp.end_date) : null),
                        is_present: exp.is_present || false,
                        description: exp.description || null,
                        experience_letter_file: null,
                        salary_slip_file: null,
                        created_by: user_id,
                        updated_by: null,
                        deleted_by: null,
                    });
                }
            }
        }

        // Create user metadata if provided
        if (candidateData.metadata) {
            await userMetadataService.createUserMetadata({
                org_id,
                user_id: candidateUser.id,
                gender: candidateData.metadata.gender || null,
                date_of_birth: candidateData.metadata.date_of_birth || null,
                address_line_1: candidateData.metadata.address_line_1 || null,
                address_line_2: candidateData.metadata.address_line_2 || null,
                city: candidateData.metadata.city || null,
                state: candidateData.metadata.state || null,
                pincode: candidateData.metadata.pincode || null,
                country: candidateData.metadata.country || null,
                aadhar_card_number: candidateData.metadata.aadhar_card_number || null,
                pan_card_number: candidateData.metadata.pan_card_number || null,
                created_by: user_id,
                updated_by: null,
                deleted_by: null,
            });
        }

        // Create resume records if pre-uploaded files were provided
        if (candidateData.resumes && candidateData.resumes.length > 0) {
            for (const resume of candidateData.resumes) {
                await createResume({
                    org_id,
                    user_id: candidateUser.id,
                    file_name: resume.file_name,
                    file_path: resume.file_path,
                    created_by: user_id,
                    updated_by: user_id,
                    deleted_by: null,
                });
            }
        }

        // Add candidate to Elasticsearch index
        await addCandidateIndex(candidateUser.id, org_id);

        return res.status(201).json({
            message: "Candidate created successfully",
            data: candidateUser,
        });

    } catch (error) {
        if (isUniqueViolation(error)) {
            return res.status(400).json({
                message: "Candidate Email Already Exist",
                email: candidateData.email,
                full_message: `${candidateData.email} already exist, please use another email`,
            });
        }
        console.error("Error creating candidate:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

export const getCandidates = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const {
            limit = 20, search_after, format, search,
            skillIds, industryId, minExperience, maxExperience, gender,
            city, state, country, status,
            noticePeriodMin, noticePeriodMax,
            uniqueId, createdById, updatedById,
            lastActivityFrom,
            sort_by, sort_order,
        } = req.query;

        // Parse skillIds (comma-separated list of skill IDs)
        const parsedSkillIds = skillIds
            ? (skillIds as string).split(",").map((s) => parseInt(s.trim())).filter(n => !isNaN(n))
            : undefined;

        const filterOptions = {
            search: search as string || undefined,
            skillIds: parsedSkillIds && parsedSkillIds.length > 0 ? parsedSkillIds : undefined,
            industryId: industryId ? parseInt(industryId as string) : undefined,
            minExperience: minExperience ? Number(minExperience) : undefined,
            maxExperience: maxExperience ? Number(maxExperience) : undefined,
            gender: gender as string || undefined,
            city: city as string || undefined,
            state: state as string || undefined,
            country: country as string || undefined,
            status: status as string || undefined,
            noticePeriodMin: noticePeriodMin ? Number(noticePeriodMin) : undefined,
            noticePeriodMax: noticePeriodMax ? Number(noticePeriodMax) : undefined,
            uniqueId: uniqueId as string || undefined,
            createdById: createdById ? parseInt(createdById as string) : undefined,
            updatedById: updatedById ? parseInt(updatedById as string) : undefined,
            lastActivityFrom: lastActivityFrom as string || undefined,
        };

        if (format === "csv") {
            const csv = await candidateService.getCandidatesCsvFromES(org_id, filterOptions);
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename="candidates.csv"`);
            return res.send(csv);
        }

        // Parse search_after cursor from comma-separated query param
        const parsedSearchAfter = search_after
            ? (search_after as string).split(",").map((v) => {
                const num = Number(v);
                return isNaN(num) ? v : num;
            })
            : undefined;

        const result = await candidateService.getCandidates(org_id, {
            ...filterOptions,
            search_after: parsedSearchAfter,
            limit: Number(limit),
            sort_by: sort_by as string | undefined,
            sort_order: (sort_order === "asc" || sort_order === "desc") ? sort_order : undefined,
        });

        return res.status(200).json({
            message: "Candidates fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error("Error fetching candidates:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const { id } = req.params;

        const candidate = await candidateService.getCandidateById(Number(id), org_id);

        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }

        // Get notes for this candidate
        const notes = await getCandidateNotesWithCreator(Number(id), org_id);

        return res.status(200).json({
            message: "Candidate fetched successfully",
            data: { ...candidate, notes },
        });
    } catch (error: any) {
        console.error("Error fetching candidate:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const deleteCandidate = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;

        const exist = await candidateService.getCandidateById(Number(id), org_id);

        if (exist) await candidateService.deleteCandidate(Number(id), org_id, user_id);

        // Remove candidate from Elasticsearch index
        if (exist) await removeCandidateIndex(Number(id));

        return res.status(200).json({ message: "Candidate deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting candidate:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const updateCandidate = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;
        const candidateData: z.infer<typeof updateCandidateType> = req.body;

        const candidate = await candidateService.updateCandidate(
            Number(id),
            org_id,
            user_id,
            {
                first_name: candidateData.first_name,
                last_name: candidateData.last_name,
                phone: candidateData.phone,
                designation: candidateData.designation || null,
                experience_years: candidateData.experience_years || null,
                notice_period: candidateData.notice_period || null,
                short_summary: candidateData.short_summary || null,
                objectives: candidateData.objectives || null,
                industry_id: candidateData.industry_id || null,
                linkedin_url: candidateData.linkedin_url || null,
                skills: candidateData.skills,
            }
        );

        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }

        // Handle experiences if provided
        if (candidateData.experiences) {
            for (const exp of candidateData.experiences) {
                if (exp.id && exp.isDeleted) {
                    // Delete existing experience (soft delete)
                    await experienceService.deleteExperience(
                        { id: exp.id },
                        { deleted_at: new Date(), deleted_by: user_id }
                    );
                } else if (exp.id && !exp.isDeleted) {
                    // Update existing experience
                    const existingExp = await experienceService.getExperience({
                        id: exp.id,
                        org_id,
                        user_id: Number(id),
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
                                end_date: exp.is_present ? null : (exp.end_date ? new Date(exp.end_date) : null),
                                is_present: exp.is_present || false,
                                description: exp.description,
                                updated_by: user_id,
                            }
                        );
                    }
                } else if (!exp.id && !exp.isDeleted) {
                    // Create new experience
                    await experienceService.createExperience({
                        org_id,
                        user_id: Number(id),
                        job_title: exp.job_title || null,
                        company_name: exp.company_name || null,
                        location: exp.location || null,
                        start_date: exp.start_date ? new Date(exp.start_date) : null,
                        end_date: exp.is_present ? null : (exp.end_date ? new Date(exp.end_date) : null),
                        is_present: exp.is_present || false,
                        description: exp.description || null,
                        experience_letter_file: null,
                        salary_slip_file: null,
                        created_by: user_id,
                        updated_by: null,
                        deleted_by: null,
                    });
                }
            }
        }

        // Handle user metadata if provided
        if (candidateData.metadata) {
            const existingMetadata = await userMetadataService.getUserMetadataOne({
                user_id: Number(id),
                org_id,
                deleted_at: null,
            });

            if (existingMetadata) {
                // Update existing metadata
                await userMetadataService.updateUserMetadata(
                    { id: existingMetadata.id },
                    existingMetadata,
                    {
                        gender: candidateData.metadata.gender,
                        date_of_birth: candidateData.metadata.date_of_birth,
                        address_line_1: candidateData.metadata.address_line_1,
                        address_line_2: candidateData.metadata.address_line_2,
                        city: candidateData.metadata.city,
                        state: candidateData.metadata.state,
                        pincode: candidateData.metadata.pincode,
                        country: candidateData.metadata.country,
                        aadhar_card_number: candidateData.metadata.aadhar_card_number,
                        pan_card_number: candidateData.metadata.pan_card_number,
                        updated_by: user_id,
                    }
                );
            } else {
                // Create new metadata
                await userMetadataService.createUserMetadata({
                    org_id,
                    user_id: Number(id),
                    gender: candidateData.metadata.gender || null,
                    date_of_birth: candidateData.metadata.date_of_birth || null,
                    address_line_1: candidateData.metadata.address_line_1 || null,
                    address_line_2: candidateData.metadata.address_line_2 || null,
                    city: candidateData.metadata.city || null,
                    state: candidateData.metadata.state || null,
                    pincode: candidateData.metadata.pincode || null,
                    country: candidateData.metadata.country || null,
                    aadhar_card_number: candidateData.metadata.aadhar_card_number || null,
                    pan_card_number: candidateData.metadata.pan_card_number || null,
                    created_by: user_id,
                    updated_by: null,
                    deleted_by: null,
                });
            }
        }

        // Create resume records if pre-uploaded files were provided
        if (candidateData.resumes && candidateData.resumes.length > 0) {
            for (const resume of candidateData.resumes) {
                await createResume({
                    org_id,
                    user_id: Number(id),
                    file_name: resume.file_name,
                    file_path: resume.file_path,
                    created_by: user_id,
                    updated_by: user_id,
                    deleted_by: null,
                });
            }
        }

        // Refetch candidate to get updated data including experiences
        const updatedCandidate = await candidateService.getCandidateById(Number(id), org_id);

        // Update candidate index in Elasticsearch
        if (updatedCandidate) addCandidateIndex(updatedCandidate?.id, updatedCandidate?.org_id);

        // Reindex submissions that reference this candidate
        reindexByCandidate(Number(id), org_id);

        return res.status(200).json({
            message: "Candidate updated successfully",
            data: updatedCandidate,
        });
    } catch (error: any) {
        console.error("Error updating candidate:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const sendEmailToUsersHandler = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id, email } = req.loginUser.user;
        const { user_ids, subject, body, reply_to, link_name, link_url } = req.body;

        const result = await sendEmailToUsers({
            userIds: user_ids,
            userId: user_id,
            orgId: org_id,
            subject,
            body,
            replyTo: reply_to || email,
            linkName: link_name,
            linkUrl: link_url,
            incUserEmailCount: true,
        });

        return res.status(200).json({
            message: "Emails queued successfully",
            data: result,
        });
    } catch (error: any) {
        if (error.message.includes("No SMTP settings")) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error sending email to users:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};

export const toggleCandidateJoined = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { id } = req.params;
        const { joined } = req.body as { joined: boolean };

        const candidateDataRepo = AppDataSource.getRepository(CandidateData);
        const candidateData = await candidateDataRepo.findOne({
            where: { user_id: Number(id), org_id },
        });

        if (!candidateData) {
            return res.status(404).json({ message: "Candidate not found" });
        }

        await candidateDataRepo.update(
            { user_id: Number(id), org_id },
            { joined, updated_by: user_id }
        );

        // Update candidate ES index
        await updateCandidateJoined(Number(id), joined);

        // Update all submission ES documents for this candidate
        await updateSubmissionJoinedByCandidate(org_id, Number(id), joined);

        return res.status(200).json({
            message: joined ? "Candidate marked as joined" : "Candidate marked as not joined",
            data: { joined },
        });
    } catch (error: any) {
        console.error("Error toggling candidate joined:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};

const BATCH_SIZE = 500;

export const sendEmailAllCandidatesHandler = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id, email } = req.loginUser.user;
        const { subject, body, reply_to, link_name, link_url, filters } = req.body;

        // Fetch all matching candidate user IDs from ES in batches
        const allIds: number[] = [];
        let hasMore = true;
        let searchAfter: (string | number)[] | undefined;

        while (hasMore) {
            const filterOptions: CandidateFilterOptions = {
                org_id,
                idOnly: true,
                search_after: searchAfter,
                limit: BATCH_SIZE,
                search: filters?.search,
                gender: filters?.gender,
                industry_id: filters?.industry_id,
                skill_ids: filters?.skill_ids,
                city: filters?.city,
                state: filters?.state,
                country: filters?.country,
                status: filters?.status,
                experience_years_min: filters?.experience_years_min,
                experience_years_max: filters?.experience_years_max,
                notice_period_min: filters?.notice_period_min,
                notice_period_max: filters?.notice_period_max,
                unique_id: filters?.unique_id,
                created_by_id: filters?.created_by_id,
                updated_by_id: filters?.updated_by_id,
                last_activity_min: filters?.last_activity_min,
            };

            const result = await searchCandidates(filterOptions);
            const esResult = result as { ids: string[]; total: number; hasMore: boolean; last_sort: (string | number)[] | null };

            const batchIds = esResult.ids.map(Number).filter((n) => !isNaN(n));
            allIds.push(...batchIds);

            hasMore = esResult.hasMore;
            searchAfter = esResult.last_sort ?? undefined;
        }

        if (allIds.length === 0) {
            return res.status(200).json({ message: "No matching candidates found", data: { total: 0 } });
        }

        await sendEmailToUsers({
            userIds: allIds,
            userId: user_id,
            orgId: org_id,
            subject,
            body,
            replyTo: reply_to || email,
            linkName: link_name,
            linkUrl: link_url,
            incUserEmailCount: true,
        });

        return res.status(200).json({
            message: "Emails queued successfully",
            data: { total: allIds.length },
        });
    } catch (error: any) {
        if (error.message.includes("No SMTP settings")) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error sending email to all candidates:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};