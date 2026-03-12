import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  contestant,
  event,
  eventContestant,
  eventFieldValue,
  eventJudgeAssignment,
  eventTemplate,
  judge,
  judgeScore,
  judgeType,
  penalty,
  scoreSheet,
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

export type AddEventContestantsInput = {
  contestants: AddEventContestantInput[];
};

export type SubmitJudgeScoreInput = {
  judgeId: string;
  contestantId: string;
  score?: string | number | null;
  deductions?: Array<string | number>;
  penalty?: string | number | null;
};

export type EventListItem = {
  id: string;
  title: string;
  status: string;
  isScoringLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EventDetails = {
  event: EventListItem & { templateId: string };
  template: Awaited<ReturnType<typeof getTemplateById>>;
  formValues: Record<string, string>;
  judges: EventJudgeRecord[];
  contestants: EventContestantRecord[];
};

export type JudgeSubmissionRecord = {
  contestantId: string;
  judgeId: string;
  judgeAssignmentId: string;
  judgeType: string;
  scoreType: "score" | "penalty";
  score: number;
  deductions: number[];
  medianDeduction: number | null;
  penalty: number | null;
};

export type JudgeScoringContext = {
  event: EventListItem & { templateId: string };
  sport: string;
  judge: EventJudgeRecord | null;
  contestants: EventContestantRecord[];
  submissions: JudgeSubmissionRecord[];
};

export type EventScoringSubmissionRecord = JudgeSubmissionRecord & {
  contestantName: string;
  contestantEntryNo: number;
  contestantTeamName: string | null;
  judgeName: string;
  judgeNumber: number;
};

export type EventScoringOverview = {
  event: EventListItem & { templateId: string };
  judges: EventJudgeRecord[];
  contestants: EventContestantRecord[];
  submissions: EventScoringSubmissionRecord[];
};

type ScoringMode = "difficulty" | "median" | "penalty";

type JudgeScoreDetails = {
  mode?: ScoringMode;
  deductions?: number[];
  medianDeduction?: number;
};

function normalizeContestantGender(value?: string | null) {
  const normalizedValue = (value ?? "").trim().toLowerCase();

  if (!normalizedValue) return null;
  if (normalizedValue === "male" || normalizedValue === "m") return "Male";
  if (normalizedValue === "female" || normalizedValue === "f") {
    return "Female";
  }

  throw new Error("INVALID_CONTESTANT_GENDER");
}

function normalizeJudgeTypeName(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function getScoringMode(judgeTypeName: string): ScoringMode {
  const normalizedJudgeType = normalizeJudgeTypeName(judgeTypeName);

  if (
    normalizedJudgeType === "difficulty body" ||
    normalizedJudgeType === "difficulty apparatus"
  ) {
    return "difficulty";
  }

  if (
    normalizedJudgeType === "artistry" ||
    normalizedJudgeType === "execution"
  ) {
    return "median";
  }

  if (
    normalizedJudgeType === "line judge" ||
    normalizedJudgeType === "time judge"
  ) {
    return "penalty";
  }

  return "difficulty";
}

function parseOptionalNonNegativeNumber(value: string | number | null | undefined) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number.parseFloat(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error("INVALID_SCORE_INPUT");
  }

  return Number(parsedValue.toFixed(2));
}

function getMedian(values: number[]) {
  if (!values.length) return null;

  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return Number(
      ((sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2).toFixed(
        2,
      ),
    );
  }

  return sortedValues[middleIndex];
}

async function getEventFormValues(eventId: string) {
  const fieldValues = await db.query.eventFieldValue.findMany({
    where: eq(eventFieldValue.eventId, eventId),
    with: {
      field: true,
      option: true,
    },
  });

  return fieldValues.reduce<Record<string, string>>((acc, value) => {
    const key = value.field?.key;
    if (!key) return acc;

    if (value.option?.value) {
      acc[key] = value.option.value;
    } else if (value.valueText !== null && value.valueText !== undefined) {
      acc[key] = value.valueText;
    }

    return acc;
  }, {});
}

async function getEventJudges(eventId: string) {
  const judgeAssignments = await db.query.eventJudgeAssignment.findMany({
    where: eq(eventJudgeAssignment.eventId, eventId),
    with: {
      judge: true,
      judgeType: true,
    },
  });

  return judgeAssignments.map((assignment) => ({
    id: assignment.judge?.id ?? assignment.judgeId,
    fullName: assignment.judge?.fullName ?? "",
    judgeType: assignment.judgeType?.name ?? "",
    judgeNumber: assignment.judgeNumber,
    eventPhaseId: assignment.eventPhaseId ?? null,
  }));
}

async function getEventContestants(eventId: string) {
  const contestantLinks = await db.query.eventContestant.findMany({
    where: eq(eventContestant.eventId, eventId),
    with: {
      contestant: true,
    },
  });

  return contestantLinks
    .map((link) => ({
      id: link.contestant?.id ?? link.contestantId,
      fullName: link.contestant?.fullName ?? "",
      teamName: link.contestant?.teamName ?? null,
      gender: link.contestant?.gender ?? null,
      entryNo: link.entryNo,
    }))
    .sort((left, right) => left.entryNo - right.entryNo);
}

async function getJudgeAssignmentForEvent(
  eventId: string,
  judgeId?: string | null,
  judgeName?: string | null,
) {
  if (judgeId?.trim()) {
    return db.query.eventJudgeAssignment.findFirst({
      where: and(
        eq(eventJudgeAssignment.eventId, eventId),
        eq(eventJudgeAssignment.judgeId, judgeId.trim()),
      ),
      with: {
        judge: true,
        judgeType: true,
      },
    });
  }

  if (!judgeName?.trim()) {
    return null;
  }

  const assignments = await db.query.eventJudgeAssignment.findMany({
    where: eq(eventJudgeAssignment.eventId, eventId),
    with: {
      judge: true,
      judgeType: true,
    },
  });

  return (
    assignments.find(
      (assignment) => assignment.judge?.fullName?.trim() === judgeName.trim(),
    ) ?? null
  );
}

async function getOrCreateScoreSheet(tx, eventId: string, contestantId: string) {
  const existingScoreSheet = await tx.query.scoreSheet.findFirst({
    where: and(
      eq(scoreSheet.eventId, eventId),
      eq(scoreSheet.contestantId, contestantId),
    ),
  });

  if (existingScoreSheet) {
    return existingScoreSheet;
  }

  const [createdScoreSheet] = await tx
    .insert(scoreSheet)
    .values({
      eventId,
      contestantId,
      status: "pending",
    })
    .returning();

  return createdScoreSheet;
}

async function syncScoreSheetStatus(tx, eventId: string, scoreSheetId: string) {
  const assignments = await tx.query.eventJudgeAssignment.findMany({
    where: eq(eventJudgeAssignment.eventId, eventId),
  });

  const scoreEntries = await tx.query.judgeScore.findMany({
    where: eq(judgeScore.scoreSheetId, scoreSheetId),
  });

  const penaltyEntries = await tx.query.penalty.findMany({
    where: eq(penalty.scoreSheetId, scoreSheetId),
  });

  const submittedAssignmentIds = new Set<string>();

  for (const entry of scoreEntries) {
    submittedAssignmentIds.add(entry.judgeAssignmentId);
  }

  for (const entry of penaltyEntries) {
    if (entry.judgeAssignmentId) {
      submittedAssignmentIds.add(entry.judgeAssignmentId);
    }
  }

  const nextStatus =
    submittedAssignmentIds.size === 0
      ? "pending"
      : submittedAssignmentIds.size >= assignments.length && assignments.length > 0
        ? "completed"
        : "in_progress";

  await tx
    .update(scoreSheet)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(scoreSheet.id, scoreSheetId));
}

function mapJudgeAssignmentToRecord(assignment) {
  return {
    id: assignment.judge?.id ?? assignment.judgeId,
    fullName: assignment.judge?.fullName ?? "",
    judgeType: assignment.judgeType?.name ?? "",
    judgeNumber: assignment.judgeNumber,
    eventPhaseId: assignment.eventPhaseId ?? null,
  } satisfies EventJudgeRecord;
}

function mapJudgeScoreRowToSubmission(row, judgeId: string, judgeTypeName: string) {
  const details = (row.details ?? {}) as JudgeScoreDetails;

  return {
    contestantId: row.scoreSheet.contestantId,
    judgeId,
    judgeAssignmentId: row.judgeAssignmentId,
    judgeType: judgeTypeName,
    scoreType: "score",
    score: row.rawScore,
    deductions: Array.isArray(details.deductions)
      ? details.deductions.filter((value) => typeof value === "number")
      : [],
    medianDeduction:
      typeof details.medianDeduction === "number"
        ? details.medianDeduction
        : null,
    penalty: null,
  } satisfies JudgeSubmissionRecord;
}

function mapPenaltyRowToSubmission(row, judgeId: string, judgeTypeName: string) {
  return {
    contestantId: row.scoreSheet.contestantId,
    judgeId,
    judgeAssignmentId: row.judgeAssignmentId ?? "",
    judgeType: judgeTypeName,
    scoreType: "penalty",
    score: row.value,
    deductions: [],
    medianDeduction: null,
    penalty: row.value,
  } satisfies JudgeSubmissionRecord;
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
  const createdContestants = await addEventContestants(eventId, {
    contestants: [input],
  });

  return createdContestants?.[0] ?? null;
}

export async function addEventContestants(
  eventId: string,
  input: AddEventContestantsInput,
): Promise<EventContestantRecord[] | null> {
  const normalizedEventId = eventId?.trim();
  const contestantsInput = (input.contestants ?? [])
    .map((contestantInput) => ({
      fullName: contestantInput.fullName?.trim(),
      teamName: contestantInput.teamName?.trim() || null,
      gender: normalizeContestantGender(contestantInput.gender),
      entryNo:
        contestantInput.entryNo && contestantInput.entryNo > 0
          ? contestantInput.entryNo
          : null,
    }))
    .filter((contestantInput) => contestantInput.fullName);

  if (!normalizedEventId || !contestantsInput.length) {
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

    let nextEntryNo =
      existingEntries.reduce(
        (highestEntryNo, currentEntry) =>
          Math.max(highestEntryNo, currentEntry.entryNo),
        0,
      ) + 1;

    const contestantsToInsert = contestantsInput.map((contestantInput) => {
      const entryNo = contestantInput.entryNo ?? nextEntryNo;

      if (!contestantInput.entryNo) {
        nextEntryNo += 1;
      }

      return {
        ...contestantInput,
        entryNo,
      };
    });

    const createdContestants = await tx
      .insert(contestant)
      .values(
        contestantsToInsert.map((contestantInput) => ({
          fullName: contestantInput.fullName,
          teamName: contestantInput.teamName,
          gender: contestantInput.gender,
        })),
      )
      .returning();

    await tx.insert(eventContestant).values(
      createdContestants.map((createdContestant, index) => ({
        eventId: normalizedEventId,
        contestantId: createdContestant.id,
        entryNo: contestantsToInsert[index].entryNo,
      })),
    );

    await tx
      .update(event)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(event.id, normalizedEventId));

    return createdContestants.map((createdContestant, index) => ({
      id: createdContestant.id,
      fullName: createdContestant.fullName,
      teamName: createdContestant.teamName,
      gender: createdContestant.gender,
      entryNo: contestantsToInsert[index].entryNo,
    }));
  });
}

export async function listEvents(): Promise<EventListItem[]> {
  return db
    .select({
      id: event.id,
      title: event.title,
      status: event.status,
      isScoringLocked: event.isScoringLocked,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    })
    .from(event)
    .orderBy(desc(event.createdAt));
}

export async function getEventDetails(
  eventId: string,
): Promise<EventDetails | null> {
  const eventRow = await db.query.event.findFirst({
    where: eq(event.id, eventId),
  });

  if (!eventRow) return null;

  const template = await getTemplateById(eventRow.templateId);
  if (!template) return null;

  const [formValues, judges, contestants] = await Promise.all([
    getEventFormValues(eventId),
    getEventJudges(eventId),
    getEventContestants(eventId),
  ]);

  return {
    event: {
      id: eventRow.id,
      title: eventRow.title,
      status: eventRow.status,
      isScoringLocked: eventRow.isScoringLocked,
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

export async function getJudgeScoringContext(
  eventId: string,
  judgeId?: string | null,
  judgeName?: string | null,
): Promise<JudgeScoringContext | null> {
  const normalizedEventId = eventId?.trim();

  if (!normalizedEventId) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const eventRow = await db.query.event.findFirst({
    where: eq(event.id, normalizedEventId),
  });

  if (!eventRow) {
    return null;
  }

  const [formValues, contestants, assignment] = await Promise.all([
    getEventFormValues(normalizedEventId),
    getEventContestants(normalizedEventId),
    getJudgeAssignmentForEvent(normalizedEventId, judgeId, judgeName),
  ]);

  if (!assignment) {
    return {
      event: {
        id: eventRow.id,
        title: eventRow.title,
        status: eventRow.status,
        isScoringLocked: eventRow.isScoringLocked,
        createdAt: eventRow.createdAt,
        updatedAt: eventRow.updatedAt,
        templateId: eventRow.templateId,
      },
      sport: formValues.sport ?? "",
      judge: null,
      contestants,
      submissions: [],
    };
  }

  const [scoreEntries, penaltyEntries] = await Promise.all([
    db.query.judgeScore.findMany({
      where: eq(judgeScore.judgeAssignmentId, assignment.id),
      with: {
        scoreSheet: true,
      },
    }),
    db.query.penalty.findMany({
      where: eq(penalty.judgeAssignmentId, assignment.id),
      with: {
        scoreSheet: true,
      },
    }),
  ]);

  const judgeRecord = mapJudgeAssignmentToRecord(assignment);
  const submissions = [
    ...scoreEntries.map((entry) =>
      mapJudgeScoreRowToSubmission(entry, judgeRecord.id, judgeRecord.judgeType),
    ),
    ...penaltyEntries.map((entry) =>
      mapPenaltyRowToSubmission(entry, judgeRecord.id, judgeRecord.judgeType),
    ),
  ].sort((left, right) => left.contestantId.localeCompare(right.contestantId));

  return {
    event: {
      id: eventRow.id,
      title: eventRow.title,
      status: eventRow.status,
      isScoringLocked: eventRow.isScoringLocked,
      createdAt: eventRow.createdAt,
      updatedAt: eventRow.updatedAt,
      templateId: eventRow.templateId,
    },
    sport: formValues.sport ?? "",
    judge: judgeRecord,
    contestants,
    submissions,
  };
}

export async function getEventScoringOverview(
  eventId: string,
): Promise<EventScoringOverview | null> {
  const normalizedEventId = eventId?.trim();

  if (!normalizedEventId) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const eventRow = await db.query.event.findFirst({
    where: eq(event.id, normalizedEventId),
  });

  if (!eventRow) {
    return null;
  }

  const [judges, contestants, scoreSheets] = await Promise.all([
    getEventJudges(normalizedEventId),
    getEventContestants(normalizedEventId),
    db.query.scoreSheet.findMany({
      where: eq(scoreSheet.eventId, normalizedEventId),
      with: {
        contestant: true,
        judgeScores: {
          with: {
            judgeAssignment: {
              with: {
                judge: true,
                judgeType: true,
              },
            },
          },
        },
        penalties: {
          with: {
            judgeAssignment: {
              with: {
                judge: true,
                judgeType: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const contestantRecordById = new Map(
    contestants.map((record) => [record.id, record]),
  );

  const submissions = scoreSheets
    .flatMap((sheet) => {
      const contestantRecord = contestantRecordById.get(sheet.contestantId);
      const contestantName =
        contestantRecord?.fullName ?? sheet.contestant?.fullName ?? "";
      const contestantEntryNo = contestantRecord?.entryNo ?? 0;
      const contestantTeamName =
        contestantRecord?.teamName ?? sheet.contestant?.teamName ?? null;

      const scoreEntries = sheet.judgeScores.map((entry) => {
        const details = (entry.details ?? {}) as JudgeScoreDetails;

        return {
          contestantId: sheet.contestantId,
          contestantName,
          contestantEntryNo,
          contestantTeamName,
          judgeId: entry.judgeAssignment?.judge?.id ?? entry.judgeAssignment?.judgeId ?? "",
          judgeAssignmentId: entry.judgeAssignmentId,
          judgeType: entry.judgeAssignment?.judgeType?.name ?? "",
          judgeName: entry.judgeAssignment?.judge?.fullName ?? "",
          judgeNumber: entry.judgeAssignment?.judgeNumber ?? 0,
          scoreType: "score" as const,
          score: entry.rawScore ?? 0,
          deductions: Array.isArray(details.deductions)
            ? details.deductions.filter((value) => typeof value === "number")
            : [],
          medianDeduction:
            typeof details.medianDeduction === "number"
              ? details.medianDeduction
              : null,
          penalty: null,
        };
      });

      const penaltyEntries = sheet.penalties.map((entry) => ({
        contestantId: sheet.contestantId,
        contestantName,
        contestantEntryNo,
        contestantTeamName,
        judgeId: entry.judgeAssignment?.judge?.id ?? entry.judgeAssignment?.judgeId ?? "",
        judgeAssignmentId: entry.judgeAssignmentId ?? "",
        judgeType: entry.judgeAssignment?.judgeType?.name ?? "",
        judgeName: entry.judgeAssignment?.judge?.fullName ?? "",
        judgeNumber: entry.judgeAssignment?.judgeNumber ?? 0,
        scoreType: "penalty" as const,
        score: entry.value,
        deductions: [],
        medianDeduction: null,
        penalty: entry.value,
      }));

      return [...scoreEntries, ...penaltyEntries];
    })
    .sort(
      (left, right) =>
        left.contestantEntryNo - right.contestantEntryNo ||
        left.judgeNumber - right.judgeNumber ||
        left.judgeName.localeCompare(right.judgeName),
    );

  return {
    event: {
      id: eventRow.id,
      title: eventRow.title,
      status: eventRow.status,
      isScoringLocked: eventRow.isScoringLocked,
      createdAt: eventRow.createdAt,
      updatedAt: eventRow.updatedAt,
      templateId: eventRow.templateId,
    },
    judges,
    contestants,
    submissions,
  };
}

export async function submitJudgeScore(
  eventId: string,
  input: SubmitJudgeScoreInput,
): Promise<JudgeSubmissionRecord | null> {
  const normalizedEventId = eventId?.trim();
  const normalizedJudgeId = input.judgeId?.trim();
  const normalizedContestantId = input.contestantId?.trim();

  if (!normalizedEventId || !normalizedJudgeId || !normalizedContestantId) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const eventRow = await db.query.event.findFirst({
    where: eq(event.id, normalizedEventId),
  });

  if (!eventRow) {
    return null;
  }

  if (eventRow.isScoringLocked) {
    throw new Error("SCORING_LOCKED");
  }

  const assignment = await db.query.eventJudgeAssignment.findFirst({
    where: and(
      eq(eventJudgeAssignment.eventId, normalizedEventId),
      eq(eventJudgeAssignment.judgeId, normalizedJudgeId),
    ),
    with: {
      judge: true,
      judgeType: true,
    },
  });

  if (!assignment) {
    throw new Error("INVALID_JUDGE_ASSIGNMENT");
  }

  const contestantLink = await db.query.eventContestant.findFirst({
    where: and(
      eq(eventContestant.eventId, normalizedEventId),
      eq(eventContestant.contestantId, normalizedContestantId),
    ),
  });

  if (!contestantLink) {
    throw new Error("INVALID_CONTESTANT");
  }

  const judgeTypeName = assignment.judgeType?.name ?? "";
  const scoringMode = getScoringMode(judgeTypeName);

  let rawScoreValue: number | null = null;
  let penaltyValue: number | null = null;
  let details: JudgeScoreDetails | null = null;

  if (scoringMode === "difficulty") {
    rawScoreValue = parseOptionalNonNegativeNumber(input.score);

    if (rawScoreValue === null || rawScoreValue > 10) {
      throw new Error("INVALID_SCORE_INPUT");
    }
  } else if (scoringMode === "median") {
    const parsedDeductions = (input.deductions ?? [])
      .map((value) => parseOptionalNonNegativeNumber(value))
      .filter((value) => value !== null);

    if (!parsedDeductions.length) {
      throw new Error("INVALID_SCORE_INPUT");
    }

    const medianDeduction = getMedian(parsedDeductions);

    if (medianDeduction === null) {
      throw new Error("INVALID_SCORE_INPUT");
    }

    rawScoreValue = Number(Math.max(0, 10 - medianDeduction).toFixed(2));
    details = {
      mode: "median",
      deductions: parsedDeductions,
      medianDeduction,
    };
  } else {
    penaltyValue = parseOptionalNonNegativeNumber(input.penalty ?? input.score);

    if (penaltyValue === null) {
      throw new Error("INVALID_SCORE_INPUT");
    }

    details = {
      mode: "penalty",
    };
  }

  const judgeRecord = mapJudgeAssignmentToRecord(assignment);

  return db.transaction(async (tx) => {
    const scoreSheetRow = await getOrCreateScoreSheet(
      tx,
      normalizedEventId,
      normalizedContestantId,
    );

    if (scoringMode === "penalty") {
      await tx
        .insert(penalty)
        .values({
          scoreSheetId: scoreSheetRow.id,
          judgeAssignmentId: assignment.id,
          penaltyType:
            normalizeJudgeTypeName(judgeTypeName) === "time judge"
              ? "time"
              : "line",
          value: penaltyValue,
          details,
        })
        .onConflictDoUpdate({
          target: [penalty.scoreSheetId, penalty.judgeAssignmentId],
          set: {
            penaltyType:
              normalizeJudgeTypeName(judgeTypeName) === "time judge"
                ? "time"
                : "line",
            value: penaltyValue,
            details,
          },
        });
    } else {
      await tx
        .insert(judgeScore)
        .values({
          scoreSheetId: scoreSheetRow.id,
          judgeAssignmentId: assignment.id,
          rawScore: rawScoreValue,
          details,
        })
        .onConflictDoUpdate({
          target: [judgeScore.scoreSheetId, judgeScore.judgeAssignmentId],
          set: {
            rawScore: rawScoreValue,
            details,
          },
        });
    }

    await syncScoreSheetStatus(tx, normalizedEventId, scoreSheetRow.id);

    await tx
      .update(event)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(event.id, normalizedEventId));

    return {
      contestantId: normalizedContestantId,
      judgeId: judgeRecord.id,
      judgeAssignmentId: assignment.id,
      judgeType: judgeTypeName,
      scoreType: scoringMode === "penalty" ? "penalty" : "score",
      score: scoringMode === "penalty" ? penaltyValue : rawScoreValue,
      deductions: details?.deductions ?? [],
      medianDeduction: details?.medianDeduction ?? null,
      penalty: scoringMode === "penalty" ? penaltyValue : null,
    };
  });
}

export async function setEventScoringLock(
  eventId: string,
  isScoringLocked: boolean,
) {
  const normalizedEventId = eventId?.trim();

  if (!normalizedEventId) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const existingEvent = await db.query.event.findFirst({
    where: eq(event.id, normalizedEventId),
  });

  if (!existingEvent) {
    return null;
  }

  await db
    .update(event)
    .set({
      isScoringLocked,
      updatedAt: new Date(),
    })
    .where(eq(event.id, normalizedEventId));

  return {
    eventId: normalizedEventId,
    isScoringLocked,
  };
}


