import type { Request, Response } from "express";
import {
  createEventDraft,
  type CreateEventDraftInput,
  getEventDetails,
  listEvents,
  updateEvent,
  type UpdateEventInput,
} from "../services/eventService.ts";

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
    const rawId = req.params.id;
    const eventId = Array.isArray(rawId) ? rawId[0] : rawId;

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

export async function updateEventController(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    const eventId = Array.isArray(rawId) ? rawId[0] : rawId;

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

