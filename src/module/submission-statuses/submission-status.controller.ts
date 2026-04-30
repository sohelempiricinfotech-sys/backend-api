import { Request, Response } from "express";
import * as submissionStatusService from "./submission-status.services";
import * as jobService from "../job/job.services";
import { IsNull } from "typeorm";
import { StatusType } from "./submission-status.model";

export const createSubmissionStatus = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { jobId } = req.params;
        const { name, order } = req.body;

        // Verify job exists and belongs to org
        const job = await jobService.getJobPost({
            id: jobId,
            org_id,
            deleted_at: IsNull(),
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const status = await submissionStatusService.createSubmissionStatus({
            org_id,
            job_id: jobId,
            name,
            order: order ?? 2,
            is_default: false,
            status_type: StatusType.OTHER,
            created_by: user_id,
            updated_by: null,
            deleted_by: null,
        });

        return res.status(201).json({
            message: "Submission status created successfully",
            data: status,
        });
    } catch (error: any) {
        console.error("Error creating submission status:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};

export const getSubmissionStatuses = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const { jobId } = req.params;

        // Verify job exists and belongs to org
        const job = await jobService.getJobPost({
            id: jobId,
            org_id,
            deleted_at: IsNull(),
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const statuses = await submissionStatusService.getSubmissionStatusesByJobId(jobId, org_id);

        return res.status(200).json({
            message: "Submission statuses fetched successfully",
            data: statuses,
        });
    } catch (error: any) {
        console.error("Error fetching submission statuses:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};

export const updateSubmissionStatus = async (req: Request, res: Response) => {
    try {
        const { org_id, id: user_id } = req.loginUser.user;
        const { jobId, id } = req.params;
        const { name, order } = req.body;

        const status = await submissionStatusService.getSubmissionStatus({
            id: Number(id),
            job_id: jobId,
            org_id,
        });

        if (!status) {
            return res.status(404).json({ message: "Submission status not found" });
        }

        if (status.is_default) {
            return res.status(400).json({ message: "Cannot edit the default Applications status" });
        }

        await submissionStatusService.updateSubmissionStatus(
            { id: Number(id) },
            status,
            { name, order, updated_by: user_id }
        );

        return res.status(200).json({
            message: "Submission status updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating submission status:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};

export const deleteSubmissionStatus = async (req: Request, res: Response) => {
    try {
        const { org_id } = req.loginUser.user;
        const { jobId, id } = req.params;

        const status = await submissionStatusService.getSubmissionStatus({
            id: Number(id),
            job_id: jobId,
            org_id,
        });

        if (!status) {
            return res.status(404).json({ message: "Submission status not found" });
        }

        if (status.is_default) {
            return res.status(400).json({ message: "Cannot delete the default Applications status" });
        }

        if (status.status_type !== StatusType.OTHER) {
            return res.status(400).json({ message: "Cannot delete a system stage" });
        }

        // Hard delete
        await submissionStatusService.hardDeleteSubmissionStatus(Number(id), org_id);

        return res.status(200).json({
            message: "Submission status deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting submission status:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
