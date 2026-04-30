import express from "express";
import {
  createUserController,
  deleteUserController,
  filterUsers,
  getUserDetails,
  updateUserController,
} from "./user.controller";
import { zValidate } from "../../midddleware/zvalidate";
import { createTeamUserSchema, updateTeamUserSchema } from "./user.validation";
import { adminOnly } from "../../midddleware/admin-only";

const router = express.Router();

router.get("/get-all-users", filterUsers);
router.get("/get-user/:id", getUserDetails);
router.post("/create-user", adminOnly, zValidate(createTeamUserSchema), createUserController);
router.patch("/update-user/:id", adminOnly, zValidate(updateTeamUserSchema), updateUserController);
router.delete("/remove-user/:id", adminOnly, deleteUserController);

export default router;
