import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { AppDataSource } from "./data-source";
import helmet from "helmet";
import cors from "cors";
import { authMiddleware } from "./midddleware/auth";
import { adminOnly } from "./midddleware/admin-only";

import users from "./module/users/user.route";

import candidates from "./module/candidate/candidate.route";
import industries from "./module/industries/industry.route";
import sources from "./module/sources/source.route";
import roles from "./module/roles/role.route";
import skills from "./module/skills/skill.route";
import projects from "./module/projects/projects.route";
import clients from "./module/clients/client.route";
import branches from "./module/branches/branch.route";
import clientContacts from "./module/clients/client-contact.route";
import jobs from "./module/job/job.route";
import submissionStatuses from "./module/submission-statuses/submission-status.route";
import authRoutes from "./module/auth/auth.routes";
import profile from "./module/profile/profile.route";
import jobNotes from "./module/job-notes/job-note.route";
import candidateNotes from "./module/user-notes/user-note.route";
import candidateResumes from "./module/resumes/resume.route";
import submissions from "./module/submissions/submission.route";
import messageTemplates from "./module/message-templates/message-template.route";
import orgSettings from "./module/organizations/organization.route";
import smtpSettings from "./module/smtp-settings/smtp-settings.route";
import emailHistory from "./module/email-history/email-history.route";
import dashboard from "./module/dashboard/dashboard.route";
import { initIndices } from "./elastic-index/init-indices";
import { connectAmqp } from "./utility/amqp";

// Portal modules (career-portal APIs)
import portalAuthRoutes from "./portal_modules/auth/portal-auth.route";
import portalCandidateRoutes from "./portal_modules/candidate/portal-candidate.route";
import portalJobsRoutes from "./portal_modules/jobs/portal-jobs.route";
import portalSubmissionRoutes from "./portal_modules/submissions/portal-submissions.route";
import portalCandidatePublicRoutes from "./portal_modules/candidate/portal-candidate-public.route";
import { portalAuthMiddleware } from "./portal_modules/middleware/portal-auth.middleware";

import { type verifyTokenType } from "./module/auth/auth.controller"
import { type PortalUserType } from "./portal_modules/middleware/portal-auth.middleware"

// Standalone resume file upload (S3 only, no DB record)
import { uploadResumeFileController, parseResumeController, upload as resumeUpload } from "./module/resumes/resume.controller";

import esRoute from "./elasticIndex"

// define globly verify token type as request of expressjs as context of request
declare global {
  namespace Express {
    interface Request {
      loginUser: verifyTokenType;
      portalUser: PortalUserType;
    }
  }
}

const app = express();
const PORT = process.env.PORT_BUISNESS_SERVICE || 3000;
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// app.use(express.urlencoded({ extended: true }));

app.get("/health", async (_req: Request, res: Response) => {
  let esStatus: { status: string; cluster_name?: string } = { status: "unavailable" };
  try {
    const { getClusterHealth } = await import("./utility/elasticsearch");
    const health = await getClusterHealth();
    if (health) {
      esStatus = {
        status: health.status as string,
        cluster_name: health.cluster_name as string,
      };
    }
  } catch {
    // ES unavailable — degrade gracefully
  }
  const healthResponse = { status: "ok", elasticsearch: esStatus };
  res.json(healthResponse);
});

// Auth routes (no auth middleware - public routes)
app.use("/api/auth", authRoutes);

app.use("/api/profile", authMiddleware, profile);
app.use("/api/user", authMiddleware, users);

app.use("/api/candidates", authMiddleware, candidates);
app.use("/api/industries", authMiddleware, industries);
app.use("/api/sources", authMiddleware, sources);
app.use("/api/roles", authMiddleware, roles);
app.use("/api/skills", authMiddleware, skills);
app.use("/api/clients", authMiddleware, clients);
app.use("/api/clients/:clientId/branches", authMiddleware, branches);
app.use("/api/clients/:clientId/contacts", authMiddleware, clientContacts);
app.use("/api/projects", authMiddleware, projects);
app.use("/api/jobs", authMiddleware, jobs);
app.use("/api/jobs/:jobId/submission-statuses", authMiddleware, submissionStatuses);
app.use("/api/jobs/:jobId/notes", authMiddleware, jobNotes);
app.use("/api/candidates/:candidateId/notes", authMiddleware, candidateNotes);
app.use("/api/candidates/:candidateId/resumes", authMiddleware, candidateResumes);
app.use("/api/submissions", authMiddleware, submissions);
app.use("/api/message-templates", authMiddleware, messageTemplates);
app.use("/api/org-settings", authMiddleware, adminOnly, orgSettings);
app.use("/api/smtp-settings", authMiddleware, adminOnly, smtpSettings);
app.use("/api/email-history", authMiddleware, emailHistory);
app.use("/api/dashboard", authMiddleware, dashboard);
app.post("/api/resumes/upload-file", authMiddleware, resumeUpload.single("resume"), uploadResumeFileController);
app.post("/api/resumes/parse", authMiddleware, parseResumeController);

// Portal routes (career-portal APIs)
app.use("/api/portal/auth", portalAuthRoutes);
app.use("/api/portal/jobs", portalJobsRoutes);
app.use("/api/portal/candidates", portalCandidatePublicRoutes);
app.use("/api/portal/candidate", portalAuthMiddleware, portalCandidateRoutes);
app.use("/api/portal/submissions", portalAuthMiddleware, portalSubmissionRoutes);

app.use("/es", esRoute);

app.use((_, res) => res.status(404).json({ message: "Not Found" }));

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`backend listening on port ${PORT}`);
    });
    initIndices().catch((err) => console.error("[ES] Index initialization failed:", err));
    connectAmqp().catch((err) => console.error("[AMQP] Connection failed:", err));
  })
  .catch((err: unknown) => {
    console.error("Failed to initialize data source:", err);
    process.exit(1);
  });
