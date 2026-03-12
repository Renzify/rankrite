import type { Request, Response } from "express";
import {
  addEventContestants,
  addEventContestant,
  addEventJudge,
  type AddEventContestantsInput,
  type AddEventContestantInput,
  type AddEventJudgeInput,
  createEventDraft,
  type CreateEventDraftInput,
  getEventDetails,
  getEventScoringOverview,
  getJudgeScoringContext,
  listEvents,
  setEventScoringLock,
  submitJudgeScore,
  type SubmitJudgeScoreInput,
  updateEvent,
  type UpdateEventInput,
} from "../services/eventService.ts";

function getRouteParamId(req: Request) {
  const rawId = req.params.id;
  return Array.isArray(rawId) ? rawId[0] : rawId;
}

function getQueryString(req: Request, key: string) {
  const value = req.query[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function createEventDraftController(req: Request, res: Response) {
  try {
    const payload = req.body as CreateEventDraftInput;
    const draftEvent = await createEventDraft(payload);
    res.status(201).json(draftEvent);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CONTESTANT_GENDER") {
      return res.status(400).json({
        message: "Contestant gender must be Male or Female",
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

export async function listEventsController(_req: Request, res: Response) {
  try {
    const events = await listEvents();
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
    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const details = await getEventDetails(eventId);
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

export async function getEventScoringOverviewController(
  req: Request,
  res: Response,
) {
  try {
    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const details = await getEventScoringOverview(eventId);

    if (!details) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(details);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid event scoring overview request",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to fetch event scoring overview",
    });
  }
}

export async function getJudgeScoringContextController(
  req: Request,
  res: Response,
) {
  try {
    const eventId = getRouteParamId(req);
    const judgeId = getQueryString(req, "judgeId");
    const judgeName = getQueryString(req, "judgeName");

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const details = await getJudgeScoringContext(
      eventId,
      typeof judgeId === "string" ? judgeId : null,
      typeof judgeName === "string" ? judgeName : null,
    );

    if (!details) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(details);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid judge scoring request",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to fetch judge scoring context",
    });
  }
}

export async function updateEventController(req: Request, res: Response) {
  try {
    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as UpdateEventInput;
    const details = await updateEvent(eventId, payload);

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

    console.error(error);
    res.status(500).json({
      message: "Failed to update event",
    });
  }
}

export async function submitJudgeScoreController(req: Request, res: Response) {
  try {
    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as SubmitJudgeScoreInput;
    const submission = await submitJudgeScore(eventId, payload);

    if (!submission) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(submission);
  } catch (error) {
    if (error instanceof Error && error.message === "SCORING_LOCKED") {
      return res.status(423).json({
        message: "Scoring is locked for this event",
      });
    }

    if (
      error instanceof Error &&
      (error.message === "INVALID_SCORE_INPUT" ||
        error.message === "INVALID_EVENT_INPUT")
    ) {
      return res.status(400).json({
        message: "Invalid score input",
      });
    }

    if (error instanceof Error && error.message === "INVALID_JUDGE_ASSIGNMENT") {
      return res.status(404).json({
        message: "Judge assignment not found",
      });
    }

    if (error instanceof Error && error.message === "INVALID_CONTESTANT") {
      return res.status(404).json({
        message: "Contestant not found for this event",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to submit judge score",
    });
  }
}

export async function setEventScoringLockController(
  req: Request,
  res: Response,
) {
  try {
    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const { isScoringLocked } = req.body as { isScoringLocked?: boolean };

    if (typeof isScoringLocked !== "boolean") {
      return res.status(400).json({
        message: "isScoringLocked must be a boolean",
      });
    }

    const updatedLockState = await setEventScoringLock(eventId, isScoringLocked);

    if (!updatedLockState) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(updatedLockState);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT_INPUT") {
      return res.status(400).json({
        message: "Invalid scoring lock input",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Failed to update scoring lock",
    });
  }
}

export async function addEventJudgeController(req: Request, res: Response) {
  try {
    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as AddEventJudgeInput;
    const createdJudge = await addEventJudge(eventId, payload);

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

export async function addEventContestantController(req: Request, res: Response) {
  try {
    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as AddEventContestantInput;
    const createdContestant = await addEventContestant(eventId, payload);

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

export async function importEventContestantsController(
  req: Request,
  res: Response,
) {
  try {
    const eventId = getRouteParamId(req);

    if (typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        message: "Event id is required",
      });
    }

    const payload = req.body as AddEventContestantsInput;
    const createdContestants = await addEventContestants(eventId, payload);

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

