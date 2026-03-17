import type { Request, Response } from "express";
import {
  addEventContestants,
  addEventContestant,
  addEventJudge,
  type AddEventContestantsInput,
  createEventDraft,
  type AddEventContestantInput,
  type AddEventJudgeInput,
  type CreateEventDraftInput,
  deleteEventContestant,
  deleteEventJudge,
  deleteEvent,
  getEventDetails,
  getEventJudgeScores,
  listEvents,
  lockJudgeScore,
  type LockJudgeScoreInput,
  setCurrentEventPhase,
  submitJudgeScore,
  type SubmitJudgeScoreInput,
  updateEvent,
  updateEventJudge,
  updateEventContestant,
  type UpdateEventInput,
} from "../services/eventService.ts";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";

function getRouteParamId(req: Request) {
  const rawId = req.params.id;
  return Array.isArray(rawId) ? rawId[0] : rawId;
}

function getAuthenticatedUserId(req: Request) {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;

  if (typeof userId !== "string" || userId.trim() === "") {
    return null;
  }

  return userId;
}

export async function createEventDraftController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = req.body as CreateEventDraftInput;
    const draftEvent = await createEventDraft(payload, userId);
    res.status(201).json(draftEvent);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CONTESTANT_GENDER") {
      return res.status(400).json({
        message: "Contestant gender must be Male or Female",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_STATUS") {
      return res.status(400).json({
        message: "Invalid event status",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid event input",
      });
    }

    console.error(error);

    res.status(500).json({
      message: "Failed to create event draft",
    });
  }
}

export async function listEventsController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const events = await listEvents(userId);
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch events",
    });
  }
}

export async function getEventDetailsController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const details = await getEventDetails(eventId, userId);
    if (!details) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(details);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch event details",
    });
  }
}

export async function updateCurrentEventPhaseController(
  req: Request,
  res: Response,
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const rawEventPhaseId = (req.body as { eventPhaseId?: string }).eventPhaseId;
    const eventPhaseId = Array.isArray(rawEventPhaseId)
      ? rawEventPhaseId[0]
      : rawEventPhaseId;

    if (typeof eventPhaseId !== "string" || eventPhaseId.trim() === "") {
      return res.status(400).json({
        message: "Event phase id is required",
      });
    }

    const details = await setCurrentEventPhase(eventId, userId, eventPhaseId);

    if (!details) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    return res.status(200).json(details);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_PHASE") {
      return res.status(400).json({
        message: "Invalid event phase for this event",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to update current event phase",
    });
  }
}

export async function getEventJudgeScoresController(
  req: Request,
  res: Response,
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const rawContestantId = req.query.contestantId;
    const contestantId = Array.isArray(rawContestantId)
      ? rawContestantId[0]
      : rawContestantId;
    const rawJudgeId = req.query.judgeId;
    const judgeId = Array.isArray(rawJudgeId) ? rawJudgeId[0] : rawJudgeId;
    const rawEventPhaseId = req.query.eventPhaseId;
    const eventPhaseId = Array.isArray(rawEventPhaseId)
      ? rawEventPhaseId[0]
      : rawEventPhaseId;

    const judgeScores = await getEventJudgeScores(eventId, userId, {
      contestantId: typeof contestantId === "string" ? contestantId : undefined,
      judgeId: typeof judgeId === "string" ? judgeId : undefined,
      eventPhaseId:
        typeof eventPhaseId === "string" ? eventPhaseId : undefined,
    });

    if (!judgeScores) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(judgeScores);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid event input",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_PHASE") {
      return res.status(400).json({
        message: "Invalid event phase for this event",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to fetch judge scores",
    });
  }
}

export async function submitJudgeScoreController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as SubmitJudgeScoreInput;
    const submittedScore = await submitJudgeScore(eventId, userId, payload);

    if (!submittedScore) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(201).json(submittedScore);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_JUDGE_SCORE_INPUT") {
      return res.status(400).json({
        message:
          "Judge score must include an assigned judge, contestant, and valid numeric score",
      });
    }

    if (error instanceof Error && error.message === "INVALID_JUDGE_SCORE_CONTEXT") {
      return res.status(400).json({
        message: "Judge or contestant is not assigned to this event",
      });
    }

    if (error instanceof Error && error.message === "JUDGE_SCORE_LOCKED") {
      return res.status(409).json({
        message: "This judge submission is locked and can no longer be edited",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_PHASE") {
      return res.status(400).json({
        message: "Invalid event phase for this event",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to submit judge score",
    });
  }
}

export async function lockJudgeScoreController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as LockJudgeScoreInput;
    const lockedScore = await lockJudgeScore(eventId, userId, payload);

    if (!lockedScore) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(lockedScore);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_JUDGE_SCORE_LOCK_INPUT") {
      return res.status(400).json({
        message: "Judge score lock requires an assigned judge and contestant",
      });
    }

    if (error instanceof Error && error.message === "INVALID_JUDGE_SCORE_CONTEXT") {
      return res.status(400).json({
        message: "Judge or contestant is not assigned to this event",
      });
    }

    if (error instanceof Error && error.message === "JUDGE_SCORE_NOT_FOUND") {
      return res.status(404).json({
        message: "Judge submission not found for this contestant",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_PHASE") {
      return res.status(400).json({
        message: "Invalid event phase for this event",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to lock judge score",
    });
  }
}

export async function updateEventController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as UpdateEventInput;
    const details = await updateEvent(eventId, payload, userId);

    if (!details) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(details);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid event input",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_STATUS") {
      return res.status(400).json({
        message: "Invalid event status",
      });
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_EVENT_STATUS_TRANSITION"
    ) {
      return res.status(400).json({
        message: "Event can only be set to Finished when status is Live",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to update event",
    });
  }
}

export async function deleteEventController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const deleted = await deleteEvent(eventId, userId);

    if (!deleted) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid event input",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to delete event",
    });
  }
}

export async function addEventJudgeController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as AddEventJudgeInput;
    const createdJudge = await addEventJudge(eventId, userId, payload);

    if (!createdJudge) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(201).json(createdJudge);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid judge input",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to add judge",
    });
  }
}

export async function updateEventJudgeController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);
    const rawJudgeId = req.params.judgeId;
    const judgeId = Array.isArray(rawJudgeId) ? rawJudgeId[0] : rawJudgeId;

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    if (typeof judgeId !== "string" || judgeId.trim() === "") {
      return res.status(400).json({
        message: "Judge id is required",
      });
    }

    const payload = req.body as AddEventJudgeInput;
    const updatedJudge = await updateEventJudge(eventId, userId, judgeId, payload);

    if (!updatedJudge) {
      return res.status(404).json({
        message: "Judge not found",
      });
    }

    res.status(200).json(updatedJudge);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid judge input",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to update judge",
    });
  }
}

export async function deleteEventJudgeController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);
    const rawJudgeId = req.params.judgeId;
    const judgeId = Array.isArray(rawJudgeId) ? rawJudgeId[0] : rawJudgeId;

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    if (typeof judgeId !== "string" || judgeId.trim() === "") {
      return res.status(400).json({
        message: "Judge id is required",
      });
    }

    const deletedJudge = await deleteEventJudge(eventId, userId, judgeId);

    if (!deletedJudge) {
      return res.status(404).json({
        message: "Judge not found",
      });
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid judge input",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to delete judge",
    });
  }
}

export async function addEventContestantController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as AddEventContestantInput;
    const createdContestant = await addEventContestant(eventId, userId, payload);

    if (!createdContestant) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(201).json(createdContestant);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CONTESTANT_GENDER") {
      return res.status(400).json({
        message: "Contestant gender must be Male or Female",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid contestant input",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to add contestant",
    });
  }
}

export async function updateEventContestantController(
  req: Request,
  res: Response,
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);
    const rawContestantId = req.params.contestantId;
    const contestantId = Array.isArray(rawContestantId)
      ? rawContestantId[0]
      : rawContestantId;

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    if (typeof contestantId !== "string" || contestantId.trim() === "") {
      return res.status(400).json({
        message: "Contestant id is required",
      });
    }

    const payload = req.body as AddEventContestantInput;
    const updatedContestant = await updateEventContestant(
      eventId,
      userId,
      contestantId,
      payload,
    );

    if (!updatedContestant) {
      return res.status(404).json({
        message: "Contestant not found",
      });
    }

    res.status(200).json(updatedContestant);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CONTESTANT_GENDER") {
      return res.status(400).json({
        message: "Contestant gender must be Male or Female",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid contestant input",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to update contestant",
    });
  }
}

export async function deleteEventContestantController(
  req: Request,
  res: Response,
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);
    const rawContestantId = req.params.contestantId;
    const contestantId = Array.isArray(rawContestantId)
      ? rawContestantId[0]
      : rawContestantId;

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    if (typeof contestantId !== "string" || contestantId.trim() === "") {
      return res.status(400).json({
        message: "Contestant id is required",
      });
    }

    const deletedContestant = await deleteEventContestant(
      eventId,
      userId,
      contestantId,
    );

    if (!deletedContestant) {
      return res.status(404).json({
        message: "Contestant not found",
      });
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid contestant input",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to delete contestant",
    });
  }
}

export async function importEventContestantsController(
  req: Request,
  res: Response,
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as AddEventContestantsInput;
    const createdContestants = await addEventContestants(eventId, userId, payload);

    if (!createdContestants) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(201).json(createdContestants);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CONTESTANT_GENDER") {
      return res.status(400).json({
        message: "Contestant gender must be Male or Female",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid contestant import input",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to import contestants",
    });
  }
}
