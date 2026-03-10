import { db } from "../db/index.ts";
import { event, eventFieldValue } from "../db/schema.ts";

export type CreateEventDraftFieldValueInput = {
  fieldId: string;
  optionId?: string | null;
  valueText?: string | null;
};

export type CreateEventDraftInput = {
  templateId: string;
  title: string;
  status?: "draft" | "live" | "finished";
  fieldValues?: CreateEventDraftFieldValueInput[];
};

export async function createEventDraft(input: CreateEventDraftInput) {
  const templateId = input.templateId?.trim();
  const title = input.title?.trim();
  const status = input.status ?? "draft";

  if (!templateId || !title) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const result = await db.transaction(async (tx) => {
    const [createdEvent] = await tx
      .insert(event)
      .values({
        templateId,
        title,
        status,
      })
      .returning();

    const values = (input.fieldValues ?? []).map((value) => ({
      eventId: createdEvent.id,
      fieldId: value.fieldId,
      optionId: value.optionId ?? null,
      valueText: value.valueText ?? null,
    }));

    if (values.length) {
      await tx.insert(eventFieldValue).values(values);
    }

    return createdEvent;
  });

  return result;
}

