import { Request, Response } from "express";
import { AppDataSource } from "../../data-source";
import { JobNote } from "./job-note.model";
import { IsNull } from "typeorm";
import {
  createJobNote,
  getJobNote,
} from "./job-note.services";
import { getProfilePhotoSignedUrl } from "../../utility/s3";

const jobNoteRepository = AppDataSource.getRepository(JobNote);

export const getJobNotesWithCreator = async (jobId: string, org_id: number) => {
  const notes = await jobNoteRepository
    .createQueryBuilder("note")
    .leftJoin("users", "creator", "creator.id = note.created_by AND creator.org_id = note.org_id")
    .select([
      "note.id AS id",
      "note.job_id AS job_id",
      "note.job_note AS job_note",
      "note.note_submitter AS note_submitter",
      "note.created_by AS created_by",
      "note.created_at AS created_at",
      "note.updated_at AS updated_at",
      "creator.first_name AS creator_first_name",
      "creator.last_name AS creator_last_name",
      "creator.email AS creator_email",
      "creator.id AS creator_id",
    ])
    .where("note.job_id = :jobId", { jobId })
    .andWhere("note.org_id = :org_id", { org_id })
    .andWhere("note.deleted_at IS NULL")
    .orderBy("note.created_at", "DESC")
    .getRawMany();

  // Generate signed URLs for creator profile photos from userId
  const notesWithPhotos = await Promise.all(
    notes.map(async (note) => {
      let creator_profile_photo_url: string | null = null;
      if (note.created_by) {
        try {
          creator_profile_photo_url = await getProfilePhotoSignedUrl(note.created_by);
        } catch {
          // Ignore errors for photo URL generation
        }
      }
      return { ...note, creator_profile_photo_url };
    })
  );

  return notesWithPhotos;
};

export const getJobNotesController = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;
    const { jobId } = req.params;

    const notes = await getJobNotesWithCreator(jobId, org_id);

    return res.status(200).json({
      message: "Job notes fetched successfully",
      data: notes,
    });
  } catch (error: any) {
    console.error("Error fetching job notes:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const createJobNoteController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { jobId } = req.params;
    const { job_note } = req.body;

    const newNote = await createJobNote({
      org_id,
      job_id: jobId,
      job_note,
      note_submitter: null,
      created_by: user_id,
      updated_by: null,
      deleted_by: null,
    });

    return res.status(201).json({
      message: "Job note created successfully",
      data: newNote,
    });
  } catch (error: any) {
    console.error("Error creating job note:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const updateJobNoteController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { jobId, noteId } = req.params;
    const { job_note } = req.body;

    const note = await getJobNote({
      id: Number(noteId),
      job_id: jobId,
      org_id,
      deleted_at: IsNull(),
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    note.job_note = job_note;
    note.updated_by = user_id;
    await jobNoteRepository.save(note);

    return res.status(200).json({
      message: "Job note updated successfully",
      data: note,
    });
  } catch (error: any) {
    console.error("Error updating job note:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const deleteJobNoteController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { jobId, noteId } = req.params;

    const note = await getJobNote({
      id: Number(noteId),
      job_id: jobId,
      org_id,
      deleted_at: IsNull(),
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    note.deleted_at = new Date();
    note.deleted_by = user_id;
    await jobNoteRepository.save(note);

    return res.status(200).json({
      message: "Job note deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting job note:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
