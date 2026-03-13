import { Router } from "express";
import {
  importEventContestantsController,
  addEventContestantController,
  addEventJudgeController,
  createEventDraftController,
  deleteEventController,
  getEventDetailsController,
  getEventJudgeScoresController,
  listEventsController,
  submitJudgeScoreController,
  updateEventController,
  updateEventJudgeController,
  updateEventContestantController,
} from "../controllers/eventController.ts";

const router = Router();

router.post("/events/draft", createEventDraftController);
router.get("/events", listEventsController);
router.get("/events/:id", getEventDetailsController);
router.get("/events/:id/judge-scores", getEventJudgeScoresController);
router.post("/events/:id/judge-scores", submitJudgeScoreController);
router.put("/events/:id", updateEventController);
router.delete("/events/:id", deleteEventController);
router.post("/events/:id/judges", addEventJudgeController);
router.put("/events/:id/judges/:judgeId", updateEventJudgeController);
router.post("/events/:id/contestants", addEventContestantController);
router.put(
  "/events/:id/contestants/:contestantId",
  updateEventContestantController,
);
router.post("/events/:id/contestants/import", importEventContestantsController);

export default router;
