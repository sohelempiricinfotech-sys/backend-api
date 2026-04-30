import { Router } from "express";
import * as branchController from "./branch.controller";
import { zValidate } from "../../midddleware/zvalidate";
import { createBranchSchema, updateBranchSchema } from "./branch.validation";

const router = Router({ mergeParams: true });

router.post("/", zValidate(createBranchSchema), branchController.createBranch);
router.get("/", branchController.getBranches);
router.get("/:id", branchController.getBranchById);
router.patch("/:id", zValidate(updateBranchSchema), branchController.updateBranch);
router.delete("/:id", branchController.deleteBranch);

export default router;
