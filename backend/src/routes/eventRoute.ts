import { Router } from "express";
import {
  addEventContestantController,
  addEventJudgeController,
  createEventDraftController,
  getEventDetailsController,
  listEventsController,
  updateEventController,
} from "../controllers/eventController.ts";

const router = Router();

router.post("/events/draft", createEventDraftController);
router.get("/events", listEventsController);
router.get("/events/:id", getEventDetailsController);
router.put("/events/:id", updateEventController);
router.post("/events/:id/judges", addEventJudgeController);
router.post("/events/:id/contestants", addEventContestantController);

export default router;

