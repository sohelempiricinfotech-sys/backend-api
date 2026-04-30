import { z } from "zod";

// Experience schema for nested experience data
const experienceSchema = z.object({
    id: z.number().optional(), // For existing experiences (update/delete)
    job_title: z.string().optional(),
    company_name: z.string().optional(),
    location: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    is_present: z.boolean().optional(),
    description: z.string().optional(),
    isDeleted: z.boolean().optional(), // Flag to mark for deletion
});

// Resume schema for attaching uploaded resume file
const resumeSchema = z.object({
    file_name: z.string(),
    file_path: z.string(),
});

// Metadata schema for user metadata fields
const metadataSchema = z.object({
    gender: z.string().optional().nullable(),
    date_of_birth: z.string().optional().nullable(),
    address_line_1: z.string().optional().nullable(),
    address_line_2: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    aadhar_card_number: z.string().optional().nullable(),
    pan_card_number: z.string().optional().nullable(),
});

export const createCandidateType = z.object({
    // Basic user fields
    first_name: z.string().min(2).max(255),
    last_name: z.string().min(2).max(255),
    email: z.string().email().transform(val => val.toLowerCase()),
    phone: z.string().min(0).max(0).or(z.string().min(10).max(15)).optional(),

    // Candidate data fields
    designation: z.string().optional(),
    experience_years: z.number().optional(),
    notice_period: z.number().optional(),
    short_summary: z.string().optional(),
    objectives: z.array(z.string()).optional(),
    industry_id: z.number().optional(),
    linkedin_url: z.string().url().optional().or(z.literal("")),

    // Skills (array of skill IDs)
    skills: z.array(z.number()).optional(),

    // Experiences (array of experience objects)
    experiences: z.array(experienceSchema).optional(),

    // User metadata fields
    metadata: metadataSchema.optional(),

    // Resumes (pre-uploaded files)
    resumes: z.array(resumeSchema).optional(),
});

export const sendEmailToUsersSchema = z.object({
    user_ids: z.array(z.number().int().positive()).min(1, "At least one user is required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
    reply_to: z.string().email("Invalid reply-to email").optional(),
    link_name: z.string().optional(),
    link_url: z.string().url("Invalid link URL").optional(),
});

export const sendEmailAllCandidatesSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
    reply_to: z.string().email("Invalid reply-to email").optional(),
    link_name: z.string().optional(),
    link_url: z.string().url("Invalid link URL").optional(),
    filters: z.object({
        search: z.string().optional(),
        gender: z.string().optional(),
        industry_id: z.number().int().optional(),
        skill_ids: z.array(z.number().int()).optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        status: z.string().optional(),
        experience_years_min: z.number().optional(),
        experience_years_max: z.number().optional(),
        notice_period_min: z.number().int().optional(),
        notice_period_max: z.number().int().optional(),
        unique_id: z.string().optional(),
        created_by_id: z.number().int().optional(),
        updated_by_id: z.number().int().optional(),
        last_activity_min: z.string().optional(),
    }).optional(),
});

export const toggleCandidateJoinedSchema = z.object({
    joined: z.boolean(),
});

export const updateCandidateType = z.object({
    // Basic user fields
    first_name: z.string().min(2).max(255).optional(),
    last_name: z.string().min(2).max(255).optional(),
    phone: z.string().min(0).max(0).or(z.string().min(10).max(15)).optional(),

    // Candidate data fields
    designation: z.string().optional(),
    experience_years: z.number().optional(),
    notice_period: z.number().optional(),
    short_summary: z.string().optional(),
    objectives: z.array(z.string()).optional(),
    industry_id: z.number().optional(),
    linkedin_url: z.string().url().optional().or(z.literal("")),

    // Skills (array of skill IDs)
    skills: z.array(z.number()).optional(),

    // Experiences (array of experience objects)
    experiences: z.array(experienceSchema).optional(),

    // User metadata fields
    metadata: metadataSchema.optional(),

    // Resumes (pre-uploaded files)
    resumes: z.array(resumeSchema).optional(),
});