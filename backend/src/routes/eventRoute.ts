import { Router } from "express";
import {
  importEventContestantsController,
  addEventContestantController,
  addEventJudgeController,
  createEventDraftController,
  deleteEventContestantController,
  deleteEventJudgeController,
  deleteEventController,
  getEventDetailsController,
  getEventJudgeScoresController,
  listEventsController,
  lockJudgeScoreController,
  submitJudgeScoreController,
  updateCurrentEventPhaseController,
  setEventActiveContestantController,
  updateEventController,
  updateEventJudgeController,
  updateEventContestantController,
} from "../controllers/eventController.ts";

const router = Router();

router.post("/events/draft", createEventDraftController);
router.get("/events", listEventsController);
router.get("/events/:id", getEventDetailsController);
router.put("/events/:id/current-phase", updateCurrentEventPhaseController);
router.put("/events/:id/active-contestant", setEventActiveContestantController);
router.get("/events/:id/judge-scores", getEventJudgeScoresController);
router.post("/events/:id/judge-scores", submitJudgeScoreController);
router.post("/events/:id/judge-scores/lock", lockJudgeScoreController);
router.put("/events/:id", updateEventController);
router.delete("/events/:id", deleteEventController);
router.post("/events/:id/judges", addEventJudgeController);
router.put("/events/:id/judges/:judgeId", updateEventJudgeController);
router.delete("/events/:id/judges/:judgeId", deleteEventJudgeController);
router.post("/events/:id/contestants", addEventContestantController);
router.put(
  "/events/:id/contestants/:contestantId",
  updateEventContestantController,
);
router.delete(
  "/events/:id/contestants/:contestantId",
  deleteEventContestantController,
);
router.post("/events/:id/contestants/import", importEventContestantsController);

export default router;
