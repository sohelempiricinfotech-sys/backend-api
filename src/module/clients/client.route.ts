import { Router } from "express";
import * as clientController from "./client.controller";
import { zValidate } from "../../midddleware/zvalidate";
import { createClientSchema, updateClientSchema } from "./client.validation";

const router = Router();

router.post("/", zValidate(createClientSchema), clientController.createClient);
router.get("/", clientController.getClients);
router.get("/:id", clientController.getClientById);
router.patch("/:id", zValidate(updateClientSchema), clientController.updateClient);
router.delete("/:id", clientController.deleteClient);

export default router;
