import type { Request, Response } from "express";
import {
  createEventDraft,
  type CreateEventDraftInput,
} from "../services/eventService.ts";

export async function createEventDraftController(req: Request, res: Response) {
  try {
    const payload = req.body as CreateEventDraftInput;
    const draftEvent = await createEventDraft(payload);
    res.status(201).json(draftEvent);
  } catch (error) {
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

