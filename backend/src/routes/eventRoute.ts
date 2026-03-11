import { Router } from "express";
import {
  createEventDraftController,
  getEventDetailsController,
  listEventsController,
} from "../controllers/eventController.ts";

const router = Router();

router.post("/events/draft", createEventDraftController);
router.get("/events", listEventsController);
router.get("/events/:id", getEventDetailsController);

export default router;

