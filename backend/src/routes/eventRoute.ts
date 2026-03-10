import { Router } from "express";
import { createEventDraftController } from "../controllers/eventController.ts";

const router = Router();

router.post("/events/draft", createEventDraftController);

export default router;

