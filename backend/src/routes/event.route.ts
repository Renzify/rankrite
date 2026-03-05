import express from "express";
import { db } from "../db/index.ts";
import { event, eventFieldValue } from "../db/schema.ts";

export const eventRouter = express.Router();

// POST /api/events
eventRouter.post("/", async (req, res) => {
  try {
    const { templateId, title, fieldValues } = req.body;

    const [created] = await db
      .insert(event)
      .values({ templateId, title })
      .returning();

    if (fieldValues && fieldValues.length > 0) {
      await db.insert(eventFieldValue).values(
        fieldValues.map((fv: any) => ({
          eventId: created.id,
          fieldId: fv.fieldId,
          optionId: fv.optionId,
          valueText: fv.valueText || null,
        })),
      );
    }

    res.json({ success: true, eventId: created.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});
