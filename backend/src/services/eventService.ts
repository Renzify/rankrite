import { desc, inArray } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  contestant,
  event,
  eventContestant,
  eventFieldValue,
  eventJudgeAssignment,
  judge,
  judgeType,
} from "../db/schema.ts";

export type CreateEventDraftFieldValueInput = {
  fieldId: string;
  optionId?: string | null;
  valueText?: string | null;
};

export type CreateEventDraftInput = {
  templateId: string;
  title: string;
  status?: "draft" | "live" | "finished" | "to_be_held";
  fieldValues?: CreateEventDraftFieldValueInput[];
  judges?: {
    fullName: string;
    judgeType: string;
    judgeNumber: number;
    eventPhaseId?: string | null;
  }[];
  contestants?: {
    fullName: string;
    teamName?: string | null;
    gender?: string | null;
    entryNo?: number | null;
  }[];
};

export async function createEventDraft(input: CreateEventDraftInput) {
  const templateId = input.templateId?.trim();
  const title = input.title?.trim();
  const status = input.status ?? "draft";
  const judgesInput = (input.judges ?? [])
    .map((judgeInput) => ({
      fullName: (judgeInput.fullName ?? "").trim(),
      judgeType: (judgeInput.judgeType ?? "").trim(),
      judgeNumber: Number(judgeInput.judgeNumber),
      eventPhaseId: judgeInput.eventPhaseId ?? null,
    }))
    .filter(
      (judgeInput) =>
        judgeInput.fullName &&
        judgeInput.judgeType &&
        Number.isFinite(judgeInput.judgeNumber) &&
        judgeInput.judgeNumber > 0,
    );
  const contestantsInput = (input.contestants ?? [])
    .map((contestantInput, index) => ({
      fullName: (contestantInput.fullName ?? "").trim(),
      teamName: (contestantInput.teamName ?? "").trim() || null,
      gender: (contestantInput.gender ?? "").trim() || null,
      entryNo:
        contestantInput.entryNo && contestantInput.entryNo > 0
          ? contestantInput.entryNo
          : index + 1,
    }))
    .filter((contestantInput) => contestantInput.fullName);

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

    if (judgesInput.length) {
      const typeNames = Array.from(
        new Set(judgesInput.map((judgeInput) => judgeInput.judgeType)),
      );

      const existingTypes = await tx
        .select()
        .from(judgeType)
        .where(inArray(judgeType.name, typeNames));

      const existingTypeMap = new Map(
        existingTypes.map((type) => [type.name, type.id]),
      );

      const missingTypeNames = typeNames.filter(
        (name) => !existingTypeMap.has(name),
      );

      if (missingTypeNames.length) {
        const insertedTypes = await tx
          .insert(judgeType)
          .values(missingTypeNames.map((name) => ({ name })))
          .returning();

        for (const type of insertedTypes) {
          existingTypeMap.set(type.name, type.id);
        }
      }

      const insertedJudges = await tx
        .insert(judge)
        .values(
          judgesInput.map((judgeInput) => ({
            fullName: judgeInput.fullName,
          })),
        )
        .returning();

      await tx.insert(eventJudgeAssignment).values(
        insertedJudges.map((createdJudge, index) => {
          const judgeInput = judgesInput[index];
          const judgeTypeId = existingTypeMap.get(judgeInput.judgeType);

          if (!judgeTypeId) {
            throw new Error("INVALID_EVENT_INPUT");
          }

          return {
            eventId: createdEvent.id,
            judgeId: createdJudge.id,
            judgeTypeId,
            judgeNumber: judgeInput.judgeNumber,
            eventPhaseId: judgeInput.eventPhaseId,
          };
        }),
      );
    }

    if (contestantsInput.length) {
      const insertedContestants = await tx
        .insert(contestant)
        .values(
          contestantsInput.map((contestantInput) => ({
            fullName: contestantInput.fullName,
            teamName: contestantInput.teamName,
            gender: contestantInput.gender,
          })),
        )
        .returning();

      await tx.insert(eventContestant).values(
        insertedContestants.map((createdContestant, index) => ({
          eventId: createdEvent.id,
          contestantId: createdContestant.id,
          entryNo: contestantsInput[index].entryNo,
        })),
      );
    }

    return createdEvent;
  });

  return result;
}

export type EventListItem = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listEvents(): Promise<EventListItem[]> {
  return db
    .select({
      id: event.id,
      title: event.title,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    })
    .from(event)
    .orderBy(desc(event.createdAt));
}

