import { Router } from "express";
import {
  importEventContestantsController,
  addEventContestantController,
  addEventJudgeController,
  createEventDraftController,
  getEventDetailsController,
  getEventScoringOverviewController,
  getJudgeScoringContextController,
  listEventsController,
  setEventScoringLockController,
  submitJudgeScoreController,
  updateEventController,
} from "../controllers/eventController.ts";

const router = Router();

router.post("/events/draft", createEventDraftController);
router.get("/events", listEventsController);
router.get("/events/:id", getEventDetailsController);
router.get("/events/:id/scoring-overview", getEventScoringOverviewController);
router.get("/events/:id/judge-scoring", getJudgeScoringContextController);
router.put("/events/:id", updateEventController);
router.post("/events/:id/judge-scoring", submitJudgeScoreController);
router.patch("/events/:id/scoring-lock", setEventScoringLockController);
router.post("/events/:id/judges", addEventJudgeController);
router.post("/events/:id/contestants", addEventContestantController);
router.post("/events/:id/contestants/import", importEventContestantsController);

export default router;

