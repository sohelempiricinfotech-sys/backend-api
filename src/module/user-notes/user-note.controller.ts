import { Request, Response } from "express";
import { AppDataSource } from "../../data-source";
import { UserNote, NoteType } from "./user-note.model";
import { IsNull } from "typeorm";
import {
  createUserNote,
  getUserNote,
} from "./user-note.services";
import { getProfilePhotoSignedUrl } from "../../utility/s3";

const userNoteRepository = AppDataSource.getRepository(UserNote);

export const getCandidateNotesWithCreator = async (candidateId: number, org_id: number) => {
  const notes = await userNoteRepository
    .createQueryBuilder("note")
    .leftJoin("users", "creator", "creator.id = note.created_by AND creator.org_id = note.org_id")
    .select([
      "note.id AS id",
      "note.user_id AS user_id",
      "note.note AS note",
      "note.type AS type",
      "note.note_type AS note_type",
      "note.created_by AS created_by",
      "note.created_at AS created_at",
      "note.updated_at AS updated_at",
      "creator.first_name AS creator_first_name",
      "creator.last_name AS creator_last_name",
      "creator.email AS creator_email",
      "creator.id AS creator_id",
    ])
    .where("note.user_id = :candidateId", { candidateId })
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

export const getCandidateNotesController = async (req: Request, res: Response) => {
  try {
    const { org_id } = req.loginUser.user;
    const { candidateId } = req.params;

    const notes = await getCandidateNotesWithCreator(Number(candidateId), org_id);

    return res.status(200).json({
      message: "Candidate notes fetched successfully",
      data: notes,
    });
  } catch (error: any) {
    console.error("Error fetching candidate notes:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const createCandidateNoteController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { candidateId } = req.params;
    const { note, is_call } = req.body;

    const newNote = await createUserNote({
      org_id,
      user_id: Number(candidateId),
      note,
      type: "note",
      note_type: is_call ? NoteType.CALL : NoteType.NONE,
      created_by: user_id,
      updated_by: null,
      deleted_by: null,
    });

    return res.status(201).json({
      message: "Candidate note created successfully",
      data: newNote,
    });
  } catch (error: any) {
    console.error("Error creating candidate note:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const updateCandidateNoteController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { candidateId, noteId } = req.params;
    const { note: noteContent } = req.body;

    const existingNote = await getUserNote({
      id: Number(noteId),
      user_id: Number(candidateId),
      org_id,
      deleted_at: IsNull(),
    });

    if (!existingNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    existingNote.note = noteContent;
    existingNote.updated_by = user_id;
    await userNoteRepository.save(existingNote);

    return res.status(200).json({
      message: "Candidate note updated successfully",
      data: existingNote,
    });
  } catch (error: any) {
    console.error("Error updating candidate note:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const deleteCandidateNoteController = async (req: Request, res: Response) => {
  try {
    const { org_id, id: user_id } = req.loginUser.user;
    const { candidateId, noteId } = req.params;

    const existingNote = await getUserNote({
      id: Number(noteId),
      user_id: Number(candidateId),
      org_id,
      deleted_at: IsNull(),
    });

    if (!existingNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    existingNote.deleted_at = new Date();
    existingNote.deleted_by = user_id;
    await userNoteRepository.save(existingNote);

    return res.status(200).json({
      message: "Candidate note deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting candidate note:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
