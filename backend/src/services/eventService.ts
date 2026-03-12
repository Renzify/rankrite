import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  contestant,
  event,
  eventContestant,
  eventFieldValue,
  eventJudgeAssignment,
  eventTemplate,
  judge,
  judgeType,
} from "../db/schema.ts";
import { getTemplateById } from "./templateService.ts";

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

export type EventJudgeRecord = {
  id: string;
  fullName: string;
  judgeType: string;
  judgeNumber: number;
  eventPhaseId: string | null;
};

export type EventContestantRecord = {
  id: string;
  fullName: string;
  teamName: string | null;
  gender: string | null;
  entryNo: number;
};

export type AddEventJudgeInput = {
  fullName: string;
  judgeType: string;
  judgeNumber: number;
  eventPhaseId?: string | null;
};

export type AddEventContestantInput = {
  fullName: string;
  teamName?: string | null;
  gender?: string | null;
  entryNo?: number | null;
};

function normalizeContestantGender(value?: string | null) {
  const normalizedValue = (value ?? "").trim().toLowerCase();

  if (!normalizedValue) return null;
  if (normalizedValue === "male" || normalizedValue === "m") return "Male";
  if (normalizedValue === "female" || normalizedValue === "f") return "Female";

  throw new Error("INVALID_CONTESTANT_GENDER");
}

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
      gender: normalizeContestantGender(contestantInput.gender),
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

export type UpdateEventInput = {
  templateId: string;
  title: string;
  fieldValues?: CreateEventDraftFieldValueInput[];
};

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput,
): Promise<EventDetails | null> {
  const templateId = input.templateId?.trim();
  const title = input.title?.trim();

  if (!eventId?.trim() || !templateId || !title) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const existingEvent = await db.query.event.findFirst({
    where: eq(event.id, eventId),
  });

  if (!existingEvent) {
    return null;
  }

  const existingTemplate = await db.query.eventTemplate.findFirst({
    where: eq(eventTemplate.id, templateId),
  });

  if (!existingTemplate) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(event)
      .set({
        templateId,
        title,
        updatedAt: new Date(),
      })
      .where(eq(event.id, eventId));

    await tx.delete(eventFieldValue).where(eq(eventFieldValue.eventId, eventId));

    const values = (input.fieldValues ?? []).map((value) => ({
      eventId,
      fieldId: value.fieldId,
      optionId: value.optionId ?? null,
      valueText: value.valueText ?? null,
    }));

    if (values.length) {
      await tx.insert(eventFieldValue).values(values);
    }
  });

  return getEventDetails(eventId);
}

export async function addEventJudge(
  eventId: string,
  input: AddEventJudgeInput,
): Promise<EventJudgeRecord | null> {
  const normalizedEventId = eventId?.trim();
  const fullName = input.fullName?.trim();
  const judgeTypeName = input.judgeType?.trim();
  const judgeNumber = Number(input.judgeNumber);
  const eventPhaseId = input.eventPhaseId ?? null;

  if (
    !normalizedEventId ||
    !fullName ||
    !judgeTypeName ||
    !Number.isFinite(judgeNumber) ||
    judgeNumber <= 0
  ) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const existingEvent = await db.query.event.findFirst({
    where: eq(event.id, normalizedEventId),
  });

  if (!existingEvent) {
    return null;
  }

  return db.transaction(async (tx) => {
    const existingTypes = await tx
      .select()
      .from(judgeType)
      .where(inArray(judgeType.name, [judgeTypeName]));

    const existingTypeMap = new Map(
      existingTypes.map((type) => [type.name, type.id]),
    );

    if (!existingTypeMap.has(judgeTypeName)) {
      const [insertedType] = await tx
        .insert(judgeType)
        .values({ name: judgeTypeName })
        .returning();

      if (insertedType) {
        existingTypeMap.set(insertedType.name, insertedType.id);
      }
    }

    const judgeTypeId = existingTypeMap.get(judgeTypeName);

    if (!judgeTypeId) {
      throw new Error("INVALID_EVENT_INPUT");
    }

    const [createdJudge] = await tx
      .insert(judge)
      .values({
        fullName,
      })
      .returning();

    await tx.insert(eventJudgeAssignment).values({
      eventId: normalizedEventId,
      judgeId: createdJudge.id,
      judgeTypeId,
      judgeNumber,
      eventPhaseId,
    });

    await tx
      .update(event)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(event.id, normalizedEventId));

    return {
      id: createdJudge.id,
      fullName: createdJudge.fullName,
      judgeType: judgeTypeName,
      judgeNumber,
      eventPhaseId,
    };
  });
}

export async function addEventContestant(
  eventId: string,
  input: AddEventContestantInput,
): Promise<EventContestantRecord | null> {
  const normalizedEventId = eventId?.trim();
  const fullName = input.fullName?.trim();
  const teamName = input.teamName?.trim() || null;
  const gender = normalizeContestantGender(input.gender);
  const requestedEntryNo =
    input.entryNo && input.entryNo > 0 ? input.entryNo : null;

  if (!normalizedEventId || !fullName) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const existingEvent = await db.query.event.findFirst({
    where: eq(event.id, normalizedEventId),
  });

  if (!existingEvent) {
    return null;
  }

  return db.transaction(async (tx) => {
    const existingEntries = await tx
      .select({
        entryNo: eventContestant.entryNo,
      })
      .from(eventContestant)
      .where(eq(eventContestant.eventId, normalizedEventId));

    const nextEntryNo =
      requestedEntryNo ??
      existingEntries.reduce(
        (highestEntryNo, currentEntry) =>
          Math.max(highestEntryNo, currentEntry.entryNo),
        0,
      ) +
        1;

    const [createdContestant] = await tx
      .insert(contestant)
      .values({
        fullName,
        teamName,
        gender,
      })
      .returning();

    await tx.insert(eventContestant).values({
      eventId: normalizedEventId,
      contestantId: createdContestant.id,
      entryNo: nextEntryNo,
    });

    await tx
      .update(event)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(event.id, normalizedEventId));

    return {
      id: createdContestant.id,
      fullName: createdContestant.fullName,
      teamName: createdContestant.teamName,
      gender: createdContestant.gender,
      entryNo: nextEntryNo,
    };
  });
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

export type EventDetails = {
  event: EventListItem & { templateId: string };
  template: Awaited<ReturnType<typeof getTemplateById>>;
  formValues: Record<string, string>;
  judges: EventJudgeRecord[];
  contestants: EventContestantRecord[];
};

export async function getEventDetails(eventId: string): Promise<EventDetails | null> {
  const eventRow = await db.query.event.findFirst({
    where: eq(event.id, eventId),
  });

  if (!eventRow) return null;

  const template = await getTemplateById(eventRow.templateId);
  if (!template) return null;

  const fieldValues = await db.query.eventFieldValue.findMany({
    where: eq(eventFieldValue.eventId, eventId),
    with: {
      field: true,
      option: true,
    },
  });

  const formValues = fieldValues.reduce<Record<string, string>>((acc, value) => {
    const key = value.field?.key;
    if (!key) return acc;

    if (value.option?.value) {
      acc[key] = value.option.value;
    } else if (value.valueText !== null && value.valueText !== undefined) {
      acc[key] = value.valueText;
    }

    return acc;
  }, {});

  const judgeAssignments = await db.query.eventJudgeAssignment.findMany({
    where: eq(eventJudgeAssignment.eventId, eventId),
    with: {
      judge: true,
      judgeType: true,
    },
  });

  const judges = judgeAssignments.map((assignment) => ({
    id: assignment.judge?.id ?? assignment.judgeId,
    fullName: assignment.judge?.fullName ?? "",
    judgeType: assignment.judgeType?.name ?? "",
    judgeNumber: assignment.judgeNumber,
    eventPhaseId: assignment.eventPhaseId ?? null,
  }));

  const contestantLinks = await db.query.eventContestant.findMany({
    where: eq(eventContestant.eventId, eventId),
    with: {
      contestant: true,
    },
  });

  const contestants = contestantLinks.map((link) => ({
    id: link.contestant?.id ?? link.contestantId,
    fullName: link.contestant?.fullName ?? "",
    teamName: link.contestant?.teamName ?? null,
    gender: link.contestant?.gender ?? null,
    entryNo: link.entryNo,
  }));

  return {
    event: {
      id: eventRow.id,
      title: eventRow.title,
      status: eventRow.status,
      createdAt: eventRow.createdAt,
      updatedAt: eventRow.updatedAt,
      templateId: eventRow.templateId,
    },
    template,
    formValues,
    judges,
    contestants,
  };
}

