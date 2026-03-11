import { Router } from "express";
import {
  createEventDraftController,
  listEventsController,
} from "../controllers/eventController.ts";

const router = Router();

router.post("/events/draft", createEventDraftController);
router.get("/events", listEventsController);

export default router;

