import { AppDataSource } from "./data-source"
import pLimit from "p-limit";
import {Router } from "express"
const router = Router()

import { JobPost } from "./module/job/job.model"
import { addJobIndex } from "./elastic-index/job/job.operation"
let jobIndexingInProgress = false;
async function JobRepoIndex_() {
    if (jobIndexingInProgress) {
        console.log("Job indexing is already in progress. Please wait.");
        return;
    }

    jobIndexingInProgress = true;

    const jobRepo = AppDataSource.getRepository(JobPost);

    try {
        const jobs = await jobRepo.find({
            select: ["id"],
        });

        const totalJobs = jobs.length;
        console.log("Total:", totalJobs);

        const limit = pLimit(40);

        let processed = 0;

        await Promise.all(
            jobs.map(job =>
                limit(async () => {
                    try {
                        await addJobIndex(job.id, 1);
                        processed++;
                        console.log(processed, "/", totalJobs);
                    } catch (err) {
                        console.error(`Error indexing ID ${job.id}`, err);
                    }
                })
            )
        );

    } catch (err) {
        console.error("Error during indexing:", err);
    }
}
const JobRepoIndex = (req: any, res: any) => {
    JobRepoIndex_()
    res.json({ message: "Job indexing started" });
}
router.get("/index/job", JobRepoIndex)

import { SystemRole, User } from "./module/users/user.model"
import { addCandidateIndex } from "./elastic-index/candidate/candidate.operation"
let candidateIndexingInProgress = false;
async function CandidateRepoIndex_() {
    if (candidateIndexingInProgress) {
        console.log("Candidate indexing is already in progress. Please wait.");
        return;
    }

    candidateIndexingInProgress = true;

    const candidateRepo = AppDataSource.getRepository(User);

    try {
        const candidates = await candidateRepo.find({
            select: ["id"],
            where: {
                system_role: SystemRole.CANDIDATE,
            },
        });

        const totalCandidates = candidates.length;
        console.log("Total:", totalCandidates);

        const limit = pLimit(40);

        let processed = 0;

        await Promise.all(
            candidates.map(candidate =>
                limit(async () => {
                    try {
                        await addCandidateIndex(candidate.id, 1);
                        processed++;
                        console.log(processed, "/", totalCandidates);
                    } catch (err) {
                        console.error(`Error indexing ID ${candidate.id}`, err);
                    }
                })
            )
        );

    } catch (err) {
        console.error("Error during indexing:", err);
    }
}
const CandidateRepoIndex = (req: any, res: any) => {
    CandidateRepoIndex_()
    res.json({ message: "Candidate indexing started" });
}
router.get("/index/candidate", CandidateRepoIndex)

import { Submission } from "./module/submissions/submission.model"
import { addSubmissionIndex } from "./elastic-index/submission/submission.operation"
let submissionIndexingInProgress = false;
async function submissionRepoIndex_() {
    if (submissionIndexingInProgress) {
        console.log("Submission indexing is already in progress. Please wait.");
        return;
    }

    submissionIndexingInProgress = true;

    const submissionRepo = AppDataSource.getRepository(Submission);

    try {
        const submissions = await submissionRepo.find({
            select: ["id"],
        });

        const totalSubmisson = submissions.length;
        console.log("Total:", totalSubmisson);

        const limit = pLimit(40);

        let processed = 0;

        await Promise.all(
            submissions.map(submission =>
                limit(async () => {
                    try {
                        await addSubmissionIndex(submission.id, 1);
                        processed++;
                        console.log(processed, "/", totalSubmisson);
                    } catch (err) {
                        console.error(`Error indexing ID ${submission.id}`, err);
                    }
                })
            )
        );

    } catch (err) {
        console.error("Error during indexing:", err);
    }
}
const SubmissionRepoIndex = (req: any, res: any) => {
    submissionRepoIndex_()
    res.json({ message: "Submission indexing started" });
}
router.get("/index/submission", SubmissionRepoIndex)

export default router