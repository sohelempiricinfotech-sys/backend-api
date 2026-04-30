import { Request, Response } from "express";
import { IsNull } from "typeorm";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { uploadFileToS3, getFileUrl } from "../../utility/s3";
import { parseResumeText } from "./resume.parse";
import {
  getResumes,
  getResume,
  deleteResume,
} from "./resume.services";
import { buildResumeParsePrompt } from "./resume.parse"
import { getAIResponse } from "../ai/ai.services";
import { findOrCreateSkill } from "../skills/skill.services";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  },
});

// Upload file to S3 only — no DB record created.
// Returns { file_name, file_path, file_url } for the frontend to send with candidate create/update.
export const uploadResumeFileController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const originalName = req.file.originalname;
    const s3Key = `resumes/${uuidv4()}-${originalName}`;

    await uploadFileToS3(req.file.buffer, s3Key, req.file.mimetype);

    const file_url = await getFileUrl(s3Key);

    return res.status(200).json({
      message: "File uploaded successfully",
      data: {
        file_name: req.file.originalname,
        file_path: s3Key,
        file_url,
      },
    });
  } catch (error: any) {
    console.error("Error uploading resume file:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const getResumesController = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;
    const candidateId = Number(req.params.candidateId);

    const resumes = await getResumes({
      user_id: candidateId,
      org_id,
      deleted_at: IsNull(),
    });

    const resumesWithUrls = await Promise.all(
      resumes.map(async (resume) => {
        let file_url: string | null = null;
        if (resume.file_path) {
          file_url = await getFileUrl(resume.file_path);
        }
        return { ...resume, file_url };
      })
    );

    return res.status(200).json({
      message: "Resumes fetched successfully",
      data: resumesWithUrls,
    });
  } catch (error: any) {
    console.error("Error fetching resumes:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

// Fetches the file from S3, extracts text, and logs it.
// Still returns hardcoded parsed data — AI parsing will be added later.
export const parseResumeController = async (req: Request, res: Response) => {
  try {
    const { file_path } = req.body;
    const { org_id } = req.loginUser.user
    if (!file_path) {
      return res.status(400).json({ error: "file_path is required" });
    }

    const rt = await parseResumeText(file_path);
    const prompt = buildResumeParsePrompt(rt);
    const aiResponse = await getAIResponse({ prompt, maxTokens: 2048, temperature: 0.7 });
    const resumeData = JSON.parse(aiResponse.content)
    if (resumeData.skills) {
      resumeData.skills = await Promise.all(resumeData.skills.map(async (skill: string) => {
        const s = await findOrCreateSkill(skill, org_id)
        return { value: String(s.id), label: s.name }
      }));
    }

    // const parsedData = {
    //   first_name: "Rahul",
    //   last_name: "Sharma",
    //   email: "rahul.sharma@example.com",
    //   phone: "+91 9876543210",
    //   designation: "Senior Software Engineer",
    //   gender: "Male",
    //   experience_years: 5,
    //   current_candidate_ctc: 1200000,
    //   expected_candidate_ctc: 1800000,
    //   notice_period: 30,
    //   short_summary:
    //     "Experienced full-stack developer with 5+ years of expertise in React, Node.js, and cloud technologies. Proven track record of delivering scalable web applications and leading development teams.",
    //   linkedin_url: "https://www.linkedin.com/in/rahulsharma",
    //   skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker"],
    //   objectives: [
    //     "Seeking a challenging role in a product-based company to leverage full-stack development skills.",
    //     "Aiming to transition into a technical lead position within the next 2 years.",
    //   ],
    //   experiences: [
    //     {
    //       job_title: "Senior Software Engineer",
    //       company_name: "TechCorp Solutions",
    //       location: "Bangalore, India",
    //       start_date: "2022-06-01",
    //       end_date: "",
    //       is_present: true,
    //       description:
    //         "Leading a team of 5 developers building a SaaS platform. Responsible for architecture decisions, code reviews, and mentoring junior developers.",
    //     },
    //     {
    //       job_title: "Software Engineer",
    //       company_name: "Digital Innovations Pvt Ltd",
    //       location: "Mumbai, India",
    //       start_date: "2019-08-15",
    //       end_date: "2022-05-30",
    //       is_present: false,
    //       description:
    //         "Developed and maintained multiple React-based web applications. Implemented RESTful APIs using Node.js and Express.",
    //     },
    //   ],
    //   metadata: {
    //     date_of_birth: "1995-03-15",
    //     address_line_1: "42, Koramangala 5th Block",
    //     address_line_2: "Near Sony Signal",
    //     country: "India",
    //     state: "Karnataka",
    //     city: "Bangalore",
    //     pincode: "560095",
    //     pan_card_number: "ABCDE1234F",
    //     aadhar_card_number: "123456789012",
    //   },
    // };

    return res.status(200).json({
      message: "Resume parsed successfully",
      data: resumeData,
    });
  } catch (error: any) {
    console.error("Error parsing resume:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const deleteResumeController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const candidateId = Number(req.params.candidateId);
    const resumeId = Number(req.params.resumeId);

    const resume = await getResume({
      id: resumeId,
      user_id: candidateId,
      org_id,
      deleted_at: IsNull(),
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    await deleteResume(
      { id: resumeId },
      { deleted_at: new Date(), deleted_by: user_id }
    );

    return res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting resume:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
