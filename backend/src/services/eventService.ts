import { and, asc, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  contestant,
  event,
  eventContestant,
  eventFieldValue,
  eventJudgeAssignment,
  eventPhase,
  eventTemplate,
  judge,
  judgeScore,
  judgeType,
  scoreSheet,
  templateField,
  templateFieldOption,
  templateOptionDependency,
} from "../db/schema.ts";
import { getTemplateById } from "./templateService.ts";

const EVENT_STATUS_VALUES = [
  "draft",
  "to_be_held",
  "live",
  "finished",
] as const;

type EventStatus = (typeof EVENT_STATUS_VALUES)[number];

const EVENT_STATUS_SET = new Set<string>(EVENT_STATUS_VALUES);

export type CreateEventDraftFieldValueInput = {
  fieldId: string;
  optionId?: string | null;
  valueText?: string | null;
};

export type CreateEventDraftInput = {
  templateId: string;
  title: string;
  status?: EventStatus;
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
  dScore?: number | null;
  aScore?: number | null;
  eScore?: number | null;
  penalties?: number | null;
  totalScore?: number | null;
  finalScore?: number | null;
  score?: number | null;
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
  score: number | string;
  eventPhaseId?: string | null;
};

export type LockJudgeScoreInput = {
  judgeId: string;
  contestantId: string;
  eventPhaseId?: string | null;
};

export type EventJudgeScoreRecord = {
  judgeId: string;
  contestantId: string | null;
  contestantName: string | null;
  eventPhaseId: string | null;
  rawScore: number | null;
  locked: boolean;
  submittedAt: Date | null;
};

export type EventPhaseRecord = {
  id: string;
  phaseType: string;
  label: string;
  sequenceNo: number;
  isActive: boolean;
  linkedFieldId: string | null;
  linkedOptionId: string | null;
  optionValue: string | null;
  optionLabel: string | null;
};

function parseEventStatus(value?: string | null): EventStatus | null {
  const normalizedValue = (value ?? "").trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  if (!EVENT_STATUS_SET.has(normalizedValue)) {
    return null;
  }

  return normalizedValue as EventStatus;
}

function normalizeContestantGender(value?: string | null) {
  const normalizedValue = (value ?? "").trim().toLowerCase();

  if (!normalizedValue) return null;
  if (normalizedValue === "male" || normalizedValue === "m") return "Male";
  if (normalizedValue === "female" || normalizedValue === "f") return "Female";

  throw new Error("INVALID_CONTESTANT_GENDER");
}

function normalizeJudgeTypeName(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function parsePositiveScoreValue(value: number | null | undefined) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : null;
}

function parseNonNegativeScoreValue(value: number | null | undefined) {
  return Number.isFinite(value) && Number(value) >= 0 ? Number(value) : null;
}

function getMedianScore(values: number[]) {
  if (!values.length) return null;

  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
  }

  return sortedValues[middleIndex];
}

function computeDifficultyAverageFromValues(
  rawValues: Array<number | null | undefined>,
  configuredJudgeCount: number,
) {
  if (configuredJudgeCount === 1) {
    return parsePositiveScoreValue(rawValues[0]);
  }

  if (configuredJudgeCount === 2) {
    const first = parsePositiveScoreValue(rawValues[0]);
    const second = parsePositiveScoreValue(rawValues[1]);

    if (first === null || second === null) {
      return null;
    }

    return (first + second) / 2;
  }

  return null;
}

function computeMedianJudgeTypeScoreFromValues(
  rawValues: Array<number | null | undefined>,
) {
  const submittedScores = rawValues
    .map(parseNonNegativeScoreValue)
    .filter((value): value is number => value !== null);

  return getMedianScore(submittedScores);
}

function computePenaltyScoreFromValues(
  rawValues: Array<number | null | undefined>,
  configuredJudgeCount: number,
) {
  if (configuredJudgeCount === 0) {
    return 0;
  }

  let total = 0;
  for (const rawValue of rawValues) {
    const parsedValue = parseNonNegativeScoreValue(rawValue);
    if (parsedValue === null) {
      return null;
    }

    total += parsedValue;
  }

  return total;
}

function normalizeUserId(value: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  return normalizedValue;
}

async function findOwnedEvent(eventId: string, ownerUserId: string) {
  return db.query.event.findFirst({
    where: and(
      eq(event.id, eventId),
      eq(event.createdByUserId, ownerUserId),
    ),
  });
}

function normalizeOptionalPhaseId(value?: string | null) {
  const normalizedValue = (value ?? "").trim();
  return normalizedValue || null;
}

function buildSelectedOptionByFieldId(
  rows: Array<{ fieldId: string; optionId: string | null }>,
) {
  const selectedOptionByFieldId = new Map<string, string>();

  for (const row of rows) {
    if (row.optionId) {
      selectedOptionByFieldId.set(row.fieldId, row.optionId);
    }
  }

  return selectedOptionByFieldId;
}

async function syncEventApparatusPhases(
  eventId: string,
  templateId: string,
  selectedOptionByFieldId: Map<string, string>,
) {
  const apparatusField = await db.query.templateField.findFirst({
    where: and(
      eq(templateField.templateId, templateId),
      eq(templateField.key, "apparatus"),
      eq(templateField.isActive, true),
    ),
  });

  if (!apparatusField) {
    return {
      phases: [] as EventPhaseRecord[],
      currentEventPhaseId: null as string | null,
    };
  }

  const [apparatusOptions, dependencies] = await Promise.all([
    db
      .select()
      .from(templateFieldOption)
      .where(
        and(
          eq(templateFieldOption.fieldId, apparatusField.id),
          eq(templateFieldOption.isActive, true),
        ),
      )
      .orderBy(asc(templateFieldOption.sortOrder)),
    db
      .select()
      .from(templateOptionDependency)
      .where(eq(templateOptionDependency.childFieldId, apparatusField.id)),
  ]);

  const dependenciesByOptionId = new Map<
    string,
    Array<(typeof dependencies)[number]>
  >();

  for (const dependency of dependencies) {
    const existingDependencies =
      dependenciesByOptionId.get(dependency.childOptionId) ?? [];
    existingDependencies.push(dependency);
    dependenciesByOptionId.set(dependency.childOptionId, existingDependencies);
  }

  const availableOptions =
    dependencies.length === 0
      ? apparatusOptions
      : apparatusOptions.filter((option) => {
          const optionDependencies =
            dependenciesByOptionId.get(option.id) ?? [];

          if (!optionDependencies.length) {
            return false;
          }

          return optionDependencies.some((dependency) => {
            const selectedParentOptionId = selectedOptionByFieldId.get(
              dependency.parentFieldId,
            );
            return selectedParentOptionId === dependency.parentOptionId;
          });
        });

  if (!availableOptions.length) {
    await db
      .update(eventPhase)
      .set({
        isActive: false,
      })
      .where(
        and(
          eq(eventPhase.eventId, eventId),
          eq(eventPhase.phaseType, "apparatus_round"),
        ),
      );

    return {
      phases: [] as EventPhaseRecord[],
      currentEventPhaseId: null as string | null,
    };
  }

  const availableOptionById = new Map(
    availableOptions.map((option) => [option.id, option]),
  );

  return db.transaction(async (tx) => {
    const existingPhases = await tx.query.eventPhase.findMany({
      where: and(
        eq(eventPhase.eventId, eventId),
        eq(eventPhase.phaseType, "apparatus_round"),
      ),
      orderBy: [asc(eventPhase.sequenceNo), asc(eventPhase.createdAt)],
    });

    const existingPhaseByOptionId = new Map(
      existingPhases
        .filter((phase) => phase.linkedOptionId)
        .map((phase) => [phase.linkedOptionId as string, phase]),
    );

    for (let index = 0; index < availableOptions.length; index += 1) {
      const option = availableOptions[index];
      const sequenceNo = index + 1;
      const existingPhase = existingPhaseByOptionId.get(option.id);

      if (existingPhase) {
        const shouldUpdate =
          existingPhase.label !== option.label ||
          existingPhase.sequenceNo !== sequenceNo ||
          existingPhase.linkedFieldId !== apparatusField.id ||
          existingPhase.linkedOptionId !== option.id;

        if (shouldUpdate) {
          await tx
            .update(eventPhase)
            .set({
              label: option.label,
              sequenceNo,
              linkedFieldId: apparatusField.id,
              linkedOptionId: option.id,
            })
            .where(eq(eventPhase.id, existingPhase.id));
        }

        continue;
      }

      await tx.insert(eventPhase).values({
        eventId,
        phaseType: "apparatus_round",
        label: option.label,
        sequenceNo,
        isActive: false,
        linkedFieldId: apparatusField.id,
        linkedOptionId: option.id,
      });
    }

    const availableOptionIds = availableOptions.map((option) => option.id);
    const refreshedAvailablePhases = await tx.query.eventPhase.findMany({
      where: and(
        eq(eventPhase.eventId, eventId),
        eq(eventPhase.phaseType, "apparatus_round"),
        inArray(eventPhase.linkedOptionId, availableOptionIds),
      ),
      orderBy: [asc(eventPhase.sequenceNo), asc(eventPhase.createdAt)],
    });

    const preferredActivePhase =
      refreshedAvailablePhases.find((phase) => phase.isActive) ??
      refreshedAvailablePhases[0] ??
      null;

    if (preferredActivePhase) {
      await tx
        .update(eventPhase)
        .set({
          isActive: false,
        })
        .where(
          and(
            eq(eventPhase.eventId, eventId),
            eq(eventPhase.phaseType, "apparatus_round"),
          ),
        );

      await tx
        .update(eventPhase)
        .set({
          isActive: true,
        })
        .where(eq(eventPhase.id, preferredActivePhase.id));
    }

    const phases = refreshedAvailablePhases.map((phase) => {
      const linkedOption = phase.linkedOptionId
        ? availableOptionById.get(phase.linkedOptionId)
        : null;

      return {
        id: phase.id,
        phaseType: phase.phaseType,
        label: phase.label,
        sequenceNo: phase.sequenceNo,
        isActive: preferredActivePhase
          ? phase.id === preferredActivePhase.id
          : phase.isActive,
        linkedFieldId: phase.linkedFieldId,
        linkedOptionId: phase.linkedOptionId,
        optionValue: linkedOption?.value ?? null,
        optionLabel: linkedOption?.label ?? null,
      };
    });

    return {
      phases,
      currentEventPhaseId: preferredActivePhase?.id ?? null,
    };
  });
}

async function ensureEventApparatusPhases(eventId: string, templateId: string) {
  const selectedRows = await db
    .select({
      fieldId: eventFieldValue.fieldId,
      optionId: eventFieldValue.optionId,
    })
    .from(eventFieldValue)
    .where(eq(eventFieldValue.eventId, eventId));

  return syncEventApparatusPhases(
    eventId,
    templateId,
    buildSelectedOptionByFieldId(selectedRows),
  );
}

async function resolveEventPhaseForScoring(
  eventId: string,
  requestedEventPhaseId?: string | null,
) {
  const normalizedRequestedEventPhaseId = normalizeOptionalPhaseId(
    requestedEventPhaseId,
  );

  if (normalizedRequestedEventPhaseId) {
    const matchingPhase = await db.query.eventPhase.findFirst({
      where: and(
        eq(eventPhase.id, normalizedRequestedEventPhaseId),
        eq(eventPhase.eventId, eventId),
        eq(eventPhase.phaseType, "apparatus_round"),
      ),
    });

    if (!matchingPhase) {
      throw new Error("INVALID_EVENT_PHASE");
    }

    return matchingPhase.id;
  }

  const activePhase = await db.query.eventPhase.findFirst({
    where: and(
      eq(eventPhase.eventId, eventId),
      eq(eventPhase.phaseType, "apparatus_round"),
      eq(eventPhase.isActive, true),
    ),
    orderBy: [asc(eventPhase.sequenceNo), asc(eventPhase.createdAt)],
  });

  return activePhase?.id ?? null;
}

async function resolveJudgeAssignmentForScoring(
  eventId: string,
  judgeId: string,
  scoringPhaseId: string | null,
) {
  const candidateAssignments = await db.query.eventJudgeAssignment.findMany({
    where: scoringPhaseId
      ? and(
          eq(eventJudgeAssignment.eventId, eventId),
          eq(eventJudgeAssignment.judgeId, judgeId),
          or(
            eq(eventJudgeAssignment.eventPhaseId, scoringPhaseId),
            isNull(eventJudgeAssignment.eventPhaseId),
          ),
        )
      : and(
          eq(eventJudgeAssignment.eventId, eventId),
          eq(eventJudgeAssignment.judgeId, judgeId),
          isNull(eventJudgeAssignment.eventPhaseId),
        ),
  });

  if (!candidateAssignments.length) {
    return null;
  }

  if (scoringPhaseId) {
    return (
      candidateAssignments.find(
        (assignment) => assignment.eventPhaseId === scoringPhaseId,
      ) ??
      candidateAssignments.find((assignment) => assignment.eventPhaseId === null) ??
      null
    );
  }

  return candidateAssignments.find((assignment) => assignment.eventPhaseId === null) ?? null;
}

async function ensureUniqueJudgeSeat(
  tx: typeof db,
  eventId: string,
  judgeNumber: number,
  excludedJudgeId?: string,
) {
  const existingAssignment = await tx.query.eventJudgeAssignment.findFirst({
    where: excludedJudgeId
      ? and(
          eq(eventJudgeAssignment.eventId, eventId),
          eq(eventJudgeAssignment.judgeNumber, judgeNumber),
          ne(eventJudgeAssignment.judgeId, excludedJudgeId),
        )
      : and(
          eq(eventJudgeAssignment.eventId, eventId),
          eq(eventJudgeAssignment.judgeNumber, judgeNumber),
        ),
  });

  if (existingAssignment) {
    throw new Error("DUPLICATE_JUDGE_NUMBER");
  }
}

export async function createEventDraft(
  input: CreateEventDraftInput,
  ownerUserId: string,
) {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const templateId = input.templateId?.trim();
  const title = input.title?.trim();
  const parsedStatus = parseEventStatus(input.status);
  const status = parsedStatus ?? "draft";
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

  if (input.status !== undefined && !parsedStatus) {
    throw new Error("INVALID_EVENT_STATUS");
  }

  if (!templateId || !title) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const result = await db.transaction(async (tx) => {
    const [createdEvent] = await tx
      .insert(event)
      .values({
        templateId,
        createdByUserId: normalizedOwnerUserId,
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

  await ensureEventApparatusPhases(result.id, templateId);

  return result;
}

export type UpdateEventInput = {
  templateId: string;
  title: string;
  status?: EventStatus;
  fieldValues?: CreateEventDraftFieldValueInput[];
};

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput,
  ownerUserId: string,
): Promise<EventDetails | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const templateId = input.templateId?.trim();
  const title = input.title?.trim();
  const parsedStatus = parseEventStatus(input.status);

  if (!normalizedEventId || !templateId || !title) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  if (input.status !== undefined && !parsedStatus) {
    throw new Error("INVALID_EVENT_STATUS");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return null;
  }

  if (
    parsedStatus === "finished" &&
    existingEvent.status !== "live" &&
    existingEvent.status !== "finished"
  ) {
    throw new Error("INVALID_EVENT_STATUS_TRANSITION");
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
        status: parsedStatus ?? existingEvent.status,
        updatedAt: new Date(),
      })
      .where(eq(event.id, normalizedEventId));

    await tx
      .delete(eventFieldValue)
      .where(eq(eventFieldValue.eventId, normalizedEventId));

    const values = (input.fieldValues ?? []).map((value) => ({
      eventId: normalizedEventId,
      fieldId: value.fieldId,
      optionId: value.optionId ?? null,
      valueText: value.valueText ?? null,
    }));

    if (values.length) {
      await tx.insert(eventFieldValue).values(values);
    }
  });

  await ensureEventApparatusPhases(normalizedEventId, templateId);

  return getEventDetails(normalizedEventId, normalizedOwnerUserId);
}

export async function deleteEvent(
  eventId: string,
  ownerUserId: string,
): Promise<boolean> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();

  if (!normalizedEventId) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return false;
  }

  await db.transaction(async (tx) => {
    const assignedJudges = await tx
      .select({
        judgeId: eventJudgeAssignment.judgeId,
      })
      .from(eventJudgeAssignment)
      .where(eq(eventJudgeAssignment.eventId, normalizedEventId));

    const linkedContestants = await tx
      .select({
        contestantId: eventContestant.contestantId,
      })
      .from(eventContestant)
      .where(eq(eventContestant.eventId, normalizedEventId));

    const judgeIds = Array.from(
      new Set(assignedJudges.map((assignment) => assignment.judgeId)),
    );
    const contestantIds = Array.from(
      new Set(linkedContestants.map((link) => link.contestantId)),
    );

    await tx.delete(event).where(eq(event.id, normalizedEventId));

    if (judgeIds.length) {
      const remainingJudgeAssignments = await tx
        .select({
          judgeId: eventJudgeAssignment.judgeId,
        })
        .from(eventJudgeAssignment)
        .where(inArray(eventJudgeAssignment.judgeId, judgeIds));

      const referencedJudgeIds = new Set(
        remainingJudgeAssignments.map((assignment) => assignment.judgeId),
      );
      const orphanJudgeIds = judgeIds.filter(
        (judgeId) => !referencedJudgeIds.has(judgeId),
      );

      if (orphanJudgeIds.length) {
        await tx.delete(judge).where(inArray(judge.id, orphanJudgeIds));
      }
    }

    if (contestantIds.length) {
      const remainingContestantLinks = await tx
        .select({
          contestantId: eventContestant.contestantId,
        })
        .from(eventContestant)
        .where(inArray(eventContestant.contestantId, contestantIds));

      const remainingScoreSheets = await tx
        .select({
          contestantId: scoreSheet.contestantId,
        })
        .from(scoreSheet)
        .where(inArray(scoreSheet.contestantId, contestantIds));

      const referencedContestantIds = new Set([
        ...remainingContestantLinks.map((link) => link.contestantId),
        ...remainingScoreSheets.map((sheet) => sheet.contestantId),
      ]);
      const orphanContestantIds = contestantIds.filter(
        (contestantId) => !referencedContestantIds.has(contestantId),
      );

      if (orphanContestantIds.length) {
        await tx
          .delete(contestant)
          .where(inArray(contestant.id, orphanContestantIds));
      }
    }
  });

  return true;
}

export async function addEventJudge(
  eventId: string,
  ownerUserId: string,
  input: AddEventJudgeInput,
): Promise<EventJudgeRecord | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
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

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

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

    await ensureUniqueJudgeSeat(tx, normalizedEventId, judgeNumber);

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

export async function updateEventJudge(
  eventId: string,
  ownerUserId: string,
  judgeId: string,
  input: AddEventJudgeInput,
): Promise<EventJudgeRecord | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const normalizedJudgeId = judgeId?.trim();
  const fullName = input.fullName?.trim();
  const judgeTypeName = input.judgeType?.trim();
  const judgeNumber = Number(input.judgeNumber);

  if (
    !normalizedEventId ||
    !normalizedJudgeId ||
    !fullName ||
    !judgeTypeName ||
    !Number.isFinite(judgeNumber) ||
    judgeNumber <= 0
  ) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return null;
  }

  return db.transaction(async (tx) => {
    const existingAssignment = await tx.query.eventJudgeAssignment.findFirst({
      where: and(
        eq(eventJudgeAssignment.eventId, normalizedEventId),
        eq(eventJudgeAssignment.judgeId, normalizedJudgeId),
      ),
    });

    if (!existingAssignment) {
      return null;
    }

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

    await ensureUniqueJudgeSeat(
      tx,
      normalizedEventId,
      judgeNumber,
      normalizedJudgeId,
    );

    await tx
      .update(judge)
      .set({
        fullName,
      })
      .where(eq(judge.id, normalizedJudgeId));

    await tx
      .update(eventJudgeAssignment)
      .set({
        judgeTypeId,
        judgeNumber,
      })
      .where(eq(eventJudgeAssignment.id, existingAssignment.id));

    await tx
      .update(event)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(event.id, normalizedEventId));

    return {
      id: normalizedJudgeId,
      fullName,
      judgeType: judgeTypeName,
      judgeNumber,
      eventPhaseId: existingAssignment.eventPhaseId ?? null,
    };
  });
}

export async function deleteEventJudge(
  eventId: string,
  ownerUserId: string,
  judgeId: string,
): Promise<boolean> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const normalizedJudgeId = judgeId?.trim();

  if (!normalizedEventId || !normalizedJudgeId) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return false;
  }

  return db.transaction(async (tx) => {
    const existingAssignment = await tx.query.eventJudgeAssignment.findFirst({
      where: and(
        eq(eventJudgeAssignment.eventId, normalizedEventId),
        eq(eventJudgeAssignment.judgeId, normalizedJudgeId),
      ),
    });

    if (!existingAssignment) {
      return false;
    }

    await tx
      .delete(eventJudgeAssignment)
      .where(eq(eventJudgeAssignment.id, existingAssignment.id));

    const remainingAssignments = await tx
      .select({
        judgeId: eventJudgeAssignment.judgeId,
      })
      .from(eventJudgeAssignment)
      .where(eq(eventJudgeAssignment.judgeId, normalizedJudgeId));

    if (!remainingAssignments.length) {
      await tx.delete(judge).where(eq(judge.id, normalizedJudgeId));
    }

    await tx
      .update(event)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(event.id, normalizedEventId));

    return true;
  });
}

export async function deleteEventContestant(
  eventId: string,
  ownerUserId: string,
  contestantId: string,
): Promise<boolean> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const normalizedContestantId = contestantId?.trim();

  if (!normalizedEventId || !normalizedContestantId) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return false;
  }

  return db.transaction(async (tx) => {
    const existingContestantLink = await tx.query.eventContestant.findFirst({
      where: and(
        eq(eventContestant.eventId, normalizedEventId),
        eq(eventContestant.contestantId, normalizedContestantId),
      ),
    });

    if (!existingContestantLink) {
      return false;
    }

    await tx
      .delete(scoreSheet)
      .where(
        and(
          eq(scoreSheet.eventId, normalizedEventId),
          eq(scoreSheet.contestantId, normalizedContestantId),
        ),
      );

    await tx
      .delete(eventContestant)
      .where(eq(eventContestant.id, existingContestantLink.id));

    const remainingContestantLinks = await tx
      .select({
        contestantId: eventContestant.contestantId,
      })
      .from(eventContestant)
      .where(eq(eventContestant.contestantId, normalizedContestantId));

    const remainingScoreSheets = await tx
      .select({
        contestantId: scoreSheet.contestantId,
      })
      .from(scoreSheet)
      .where(eq(scoreSheet.contestantId, normalizedContestantId));

    if (!remainingContestantLinks.length && !remainingScoreSheets.length) {
      await tx
        .delete(contestant)
        .where(eq(contestant.id, normalizedContestantId));
    }

    await tx
      .update(event)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(event.id, normalizedEventId));

    return true;
  });
}

export async function addEventContestant(
  eventId: string,
  ownerUserId: string,
  input: AddEventContestantInput,
): Promise<EventContestantRecord | null> {
  const createdContestants = await addEventContestants(eventId, ownerUserId, {
    contestants: [input],
  });

  return createdContestants?.[0] ?? null;
}

export async function updateEventContestant(
  eventId: string,
  ownerUserId: string,
  contestantId: string,
  input: AddEventContestantInput,
): Promise<EventContestantRecord | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const normalizedContestantId = contestantId?.trim();
  const fullName = input.fullName?.trim();
  const teamName = input.teamName?.trim() || null;
  const gender = normalizeContestantGender(input.gender);
  const entryNo =
    input.entryNo && input.entryNo > 0 ? Number(input.entryNo) : null;

  if (!normalizedEventId || !normalizedContestantId || !fullName) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return null;
  }

  return db.transaction(async (tx) => {
    const existingContestantLink = await tx.query.eventContestant.findFirst({
      where: and(
        eq(eventContestant.eventId, normalizedEventId),
        eq(eventContestant.contestantId, normalizedContestantId),
      ),
    });

    if (!existingContestantLink) {
      return null;
    }

    await tx
      .update(contestant)
      .set({
        fullName,
        teamName,
        gender,
      })
      .where(eq(contestant.id, normalizedContestantId));

    await tx
      .update(eventContestant)
      .set({
        entryNo: entryNo ?? existingContestantLink.entryNo,
      })
      .where(eq(eventContestant.id, existingContestantLink.id));

    await tx
      .update(event)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(event.id, normalizedEventId));

    return {
      id: normalizedContestantId,
      fullName,
      teamName,
      gender,
      entryNo: entryNo ?? existingContestantLink.entryNo,
    };
  });
}

export async function addEventContestants(
  eventId: string,
  ownerUserId: string,
  input: AddEventContestantsInput,
): Promise<EventContestantRecord[] | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
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

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

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

export async function submitJudgeScore(
  eventId: string,
  ownerUserId: string,
  input: SubmitJudgeScoreInput,
): Promise<EventJudgeScoreRecord | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const normalizedJudgeId = input.judgeId?.trim();
  const normalizedContestantId = input.contestantId?.trim();
  const rawScore = Number(input.score);

  if (
    !normalizedEventId ||
    !normalizedJudgeId ||
    !normalizedContestantId ||
    !Number.isFinite(rawScore) ||
    rawScore < 0
  ) {
    throw new Error("INVALID_JUDGE_SCORE_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return null;
  }

  const scoringEventPhaseId = await resolveEventPhaseForScoring(
    normalizedEventId,
    input.eventPhaseId,
  );

  const [judgeAssignment, contestantRecord] = await Promise.all([
    resolveJudgeAssignmentForScoring(
      normalizedEventId,
      normalizedJudgeId,
      scoringEventPhaseId,
    ),
    db
      .select({
        contestantId: contestant.id,
        contestantName: contestant.fullName,
      })
      .from(eventContestant)
      .innerJoin(contestant, eq(eventContestant.contestantId, contestant.id))
      .where(
        and(
          eq(eventContestant.eventId, normalizedEventId),
          eq(eventContestant.contestantId, normalizedContestantId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  if (!judgeAssignment || !contestantRecord) {
    throw new Error("INVALID_JUDGE_SCORE_CONTEXT");
  }

  const submittedAt = new Date();

  return db.transaction(async (tx) => {
    const existingScoreSheet = await tx.query.scoreSheet.findFirst({
      where: and(
        eq(scoreSheet.eventId, normalizedEventId),
        eq(scoreSheet.contestantId, normalizedContestantId),
        scoringEventPhaseId
          ? eq(scoreSheet.eventPhaseId, scoringEventPhaseId)
          : isNull(scoreSheet.eventPhaseId),
      ),
    });

    const activeScoreSheet =
      existingScoreSheet ??
      (
        await tx
          .insert(scoreSheet)
          .values({
            eventId: normalizedEventId,
            contestantId: normalizedContestantId,
            eventPhaseId: scoringEventPhaseId,
            status: "in_progress",
            updatedAt: submittedAt,
          })
          .returning()
      )[0];

    if (existingScoreSheet) {
      await tx
        .update(scoreSheet)
        .set({
          status: "in_progress",
          updatedAt: submittedAt,
        })
        .where(eq(scoreSheet.id, existingScoreSheet.id));
    }

    const existingJudgeScore = await tx.query.judgeScore.findFirst({
      where: and(
        eq(judgeScore.scoreSheetId, activeScoreSheet.id),
        eq(judgeScore.judgeAssignmentId, judgeAssignment.id),
      ),
      orderBy: [desc(judgeScore.createdAt)],
    });

    if (existingJudgeScore?.isLocked) {
      throw new Error("JUDGE_SCORE_LOCKED");
    }

    if (existingJudgeScore) {
      await tx
        .update(judgeScore)
        .set({
          rawScore,
          createdAt: submittedAt,
        })
        .where(eq(judgeScore.id, existingJudgeScore.id));
    } else {
      await tx.insert(judgeScore).values({
        scoreSheetId: activeScoreSheet.id,
        judgeAssignmentId: judgeAssignment.id,
        rawScore,
        isLocked: false,
        createdAt: submittedAt,
      });
    }

    return {
      judgeId: normalizedJudgeId,
      contestantId: contestantRecord.contestantId,
      contestantName: contestantRecord.contestantName,
      eventPhaseId: scoringEventPhaseId,
      rawScore,
      locked: false,
      submittedAt,
    };
  });
}

export async function lockJudgeScore(
  eventId: string,
  ownerUserId: string,
  input: LockJudgeScoreInput,
): Promise<EventJudgeScoreRecord | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const normalizedJudgeId = input.judgeId?.trim();
  const normalizedContestantId = input.contestantId?.trim();

  if (!normalizedEventId || !normalizedJudgeId || !normalizedContestantId) {
    throw new Error("INVALID_JUDGE_SCORE_LOCK_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return null;
  }

  const scoringEventPhaseId = await resolveEventPhaseForScoring(
    normalizedEventId,
    input.eventPhaseId,
  );

  const [judgeAssignment, contestantRecord] = await Promise.all([
    resolveJudgeAssignmentForScoring(
      normalizedEventId,
      normalizedJudgeId,
      scoringEventPhaseId,
    ),
    db
      .select({
        contestantId: contestant.id,
        contestantName: contestant.fullName,
      })
      .from(eventContestant)
      .innerJoin(contestant, eq(eventContestant.contestantId, contestant.id))
      .where(
        and(
          eq(eventContestant.eventId, normalizedEventId),
          eq(eventContestant.contestantId, normalizedContestantId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  if (!judgeAssignment || !contestantRecord) {
    throw new Error("INVALID_JUDGE_SCORE_CONTEXT");
  }

  return db.transaction(async (tx) => {
    const existingScoreSheet = await tx.query.scoreSheet.findFirst({
      where: and(
        eq(scoreSheet.eventId, normalizedEventId),
        eq(scoreSheet.contestantId, normalizedContestantId),
        scoringEventPhaseId
          ? eq(scoreSheet.eventPhaseId, scoringEventPhaseId)
          : isNull(scoreSheet.eventPhaseId),
      ),
    });

    if (!existingScoreSheet) {
      throw new Error("JUDGE_SCORE_NOT_FOUND");
    }

    const existingJudgeScore = await tx.query.judgeScore.findFirst({
      where: and(
        eq(judgeScore.scoreSheetId, existingScoreSheet.id),
        eq(judgeScore.judgeAssignmentId, judgeAssignment.id),
      ),
      orderBy: [desc(judgeScore.createdAt)],
    });

    if (!existingJudgeScore) {
      throw new Error("JUDGE_SCORE_NOT_FOUND");
    }

    if (!existingJudgeScore.isLocked) {
      await tx
        .update(judgeScore)
        .set({
          isLocked: true,
        })
        .where(eq(judgeScore.id, existingJudgeScore.id));
    }

    return {
      judgeId: normalizedJudgeId,
      contestantId: contestantRecord.contestantId,
      contestantName: contestantRecord.contestantName,
      eventPhaseId: scoringEventPhaseId,
      rawScore: existingJudgeScore.rawScore,
      locked: true,
      submittedAt: existingJudgeScore.createdAt,
    };
  });
}

export async function unlockJudgeScore(
  eventId: string,
  ownerUserId: string,
  input: LockJudgeScoreInput,
): Promise<EventJudgeScoreRecord | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const normalizedJudgeId = input.judgeId?.trim();
  const normalizedContestantId = input.contestantId?.trim();

  if (!normalizedEventId || !normalizedJudgeId || !normalizedContestantId) {
    throw new Error("INVALID_JUDGE_SCORE_LOCK_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return null;
  }

  const scoringEventPhaseId = await resolveEventPhaseForScoring(
    normalizedEventId,
    input.eventPhaseId,
  );

  const [judgeAssignment, contestantRecord] = await Promise.all([
    resolveJudgeAssignmentForScoring(
      normalizedEventId,
      normalizedJudgeId,
      scoringEventPhaseId,
    ),
    db
      .select({
        contestantId: contestant.id,
        contestantName: contestant.fullName,
      })
      .from(eventContestant)
      .innerJoin(contestant, eq(eventContestant.contestantId, contestant.id))
      .where(
        and(
          eq(eventContestant.eventId, normalizedEventId),
          eq(eventContestant.contestantId, normalizedContestantId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  if (!judgeAssignment || !contestantRecord) {
    throw new Error("INVALID_JUDGE_SCORE_CONTEXT");
  }

  return db.transaction(async (tx) => {
    const existingScoreSheet = await tx.query.scoreSheet.findFirst({
      where: and(
        eq(scoreSheet.eventId, normalizedEventId),
        eq(scoreSheet.contestantId, normalizedContestantId),
        scoringEventPhaseId
          ? eq(scoreSheet.eventPhaseId, scoringEventPhaseId)
          : isNull(scoreSheet.eventPhaseId),
      ),
    });

    if (!existingScoreSheet) {
      throw new Error("JUDGE_SCORE_NOT_FOUND");
    }

    const existingJudgeScore = await tx.query.judgeScore.findFirst({
      where: and(
        eq(judgeScore.scoreSheetId, existingScoreSheet.id),
        eq(judgeScore.judgeAssignmentId, judgeAssignment.id),
      ),
      orderBy: [desc(judgeScore.createdAt)],
    });

    if (!existingJudgeScore) {
      throw new Error("JUDGE_SCORE_NOT_FOUND");
    }

    if (existingJudgeScore.isLocked) {
      await tx
        .update(judgeScore)
        .set({
          isLocked: false,
        })
        .where(eq(judgeScore.id, existingJudgeScore.id));
    }

    return {
      judgeId: normalizedJudgeId,
      contestantId: contestantRecord.contestantId,
      contestantName: contestantRecord.contestantName,
      eventPhaseId: scoringEventPhaseId,
      rawScore: existingJudgeScore.rawScore,
      locked: false,
      submittedAt: existingJudgeScore.createdAt,
    };
  });
}

export async function getEventJudgeScores(
  eventId: string,
  ownerUserId: string,
  options?: {
    contestantId?: string;
    judgeId?: string;
    eventPhaseId?: string | null;
  },
): Promise<EventJudgeScoreRecord[] | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const normalizedContestantId = options?.contestantId?.trim() || undefined;
  const normalizedJudgeId = options?.judgeId?.trim() || undefined;

  if (!normalizedEventId) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return null;
  }

  const scoringEventPhaseId = await resolveEventPhaseForScoring(
    normalizedEventId,
    options?.eventPhaseId,
  );
  const assignmentPhaseCondition = scoringEventPhaseId
    ? or(
        eq(eventJudgeAssignment.eventPhaseId, scoringEventPhaseId),
        isNull(eventJudgeAssignment.eventPhaseId),
      )
    : isNull(eventJudgeAssignment.eventPhaseId);
  const scoreSheetPhaseCondition = scoringEventPhaseId
    ? eq(scoreSheet.eventPhaseId, scoringEventPhaseId)
    : isNull(scoreSheet.eventPhaseId);

  const [judgeAssignments, scoreRows] = await Promise.all([
    db
      .select({
        judgeId: eventJudgeAssignment.judgeId,
      })
      .from(eventJudgeAssignment)
      .where(
        normalizedJudgeId
          ? and(
              eq(eventJudgeAssignment.eventId, normalizedEventId),
              eq(eventJudgeAssignment.judgeId, normalizedJudgeId),
              assignmentPhaseCondition,
            )
          : and(
              eq(eventJudgeAssignment.eventId, normalizedEventId),
              assignmentPhaseCondition,
            ),
      ),
    db
      .select({
        judgeId: eventJudgeAssignment.judgeId,
        contestantId: scoreSheet.contestantId,
        contestantName: contestant.fullName,
        eventPhaseId: scoreSheet.eventPhaseId,
        rawScore: judgeScore.rawScore,
        locked: judgeScore.isLocked,
        submittedAt: judgeScore.createdAt,
      })
      .from(judgeScore)
      .innerJoin(
        eventJudgeAssignment,
        eq(judgeScore.judgeAssignmentId, eventJudgeAssignment.id),
      )
      .innerJoin(scoreSheet, eq(judgeScore.scoreSheetId, scoreSheet.id))
      .innerJoin(contestant, eq(scoreSheet.contestantId, contestant.id))
      .where(
        normalizedContestantId && normalizedJudgeId
          ? and(
              eq(scoreSheet.eventId, normalizedEventId),
              eq(scoreSheet.contestantId, normalizedContestantId),
              eq(eventJudgeAssignment.judgeId, normalizedJudgeId),
              assignmentPhaseCondition,
              scoreSheetPhaseCondition,
            )
          : normalizedContestantId
            ? and(
                eq(scoreSheet.eventId, normalizedEventId),
                eq(scoreSheet.contestantId, normalizedContestantId),
                assignmentPhaseCondition,
                scoreSheetPhaseCondition,
              )
            : normalizedJudgeId
              ? and(
                  eq(scoreSheet.eventId, normalizedEventId),
                  eq(eventJudgeAssignment.judgeId, normalizedJudgeId),
                  assignmentPhaseCondition,
                  scoreSheetPhaseCondition,
                )
              : and(
                  eq(scoreSheet.eventId, normalizedEventId),
                  assignmentPhaseCondition,
                  scoreSheetPhaseCondition,
                ),
      )
      .orderBy(desc(judgeScore.createdAt)),
  ]);

  if (normalizedJudgeId && !normalizedContestantId) {
    const latestScoreByContestantId = new Map<
      string,
      (typeof scoreRows)[number]
    >();

    for (const scoreRow of scoreRows) {
      if (!scoreRow.contestantId || latestScoreByContestantId.has(scoreRow.contestantId)) {
        continue;
      }

      latestScoreByContestantId.set(scoreRow.contestantId, scoreRow);
    }

    return Array.from(latestScoreByContestantId.values()).map((scoreRow) => ({
      judgeId: scoreRow.judgeId,
      contestantId: scoreRow.contestantId,
      contestantName: scoreRow.contestantName,
      eventPhaseId: scoreRow.eventPhaseId ?? scoringEventPhaseId,
      rawScore: scoreRow.rawScore,
      locked: scoreRow.locked,
      submittedAt: scoreRow.submittedAt,
    }));
  }

  const latestScoreByJudgeId = new Map<string, (typeof scoreRows)[number]>();

  for (const scoreRow of scoreRows) {
    if (!latestScoreByJudgeId.has(scoreRow.judgeId)) {
      latestScoreByJudgeId.set(scoreRow.judgeId, scoreRow);
    }
  }

  return judgeAssignments.map((assignment) => {
    const latestScore = latestScoreByJudgeId.get(assignment.judgeId);

    return {
      judgeId: assignment.judgeId,
      contestantId: latestScore?.contestantId ?? null,
      contestantName: latestScore?.contestantName ?? null,
      eventPhaseId: latestScore?.eventPhaseId ?? scoringEventPhaseId,
      rawScore: latestScore?.rawScore ?? null,
      locked: latestScore?.locked ?? false,
      submittedAt: latestScore?.submittedAt ?? null,
    };
  });
}

export type SetEventActiveContestantInput = {
  contestantId?: string | null;
};

export async function setEventActiveContestant(
  eventId: string,
  ownerUserId: string,
  input: SetEventActiveContestantInput,
): Promise<EventDetails | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const normalizedContestantId = (input.contestantId ?? "").toString().trim();

  if (!normalizedEventId) {
    throw new Error("INVALID_ACTIVE_CONTESTANT_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return null;
  }

  const nextActiveContestantId = normalizedContestantId || null;

  if (nextActiveContestantId) {
    const contestantLink = await db
      .select({
        contestantId: eventContestant.contestantId,
      })
      .from(eventContestant)
      .where(
        and(
          eq(eventContestant.eventId, normalizedEventId),
          eq(eventContestant.contestantId, nextActiveContestantId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!contestantLink) {
      throw new Error("INVALID_ACTIVE_CONTESTANT_CONTEXT");
    }
  }

  await db
    .update(event)
    .set({
      activeContestantId: nextActiveContestantId,
      updatedAt: new Date(),
    })
    .where(eq(event.id, normalizedEventId));

  return getEventDetails(normalizedEventId, normalizedOwnerUserId);
}
export async function setCurrentEventPhase(
  eventId: string,
  ownerUserId: string,
  eventPhaseId: string,
): Promise<EventDetails | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();
  const normalizedEventPhaseId = normalizeOptionalPhaseId(eventPhaseId);

  if (!normalizedEventId || !normalizedEventPhaseId) {
    throw new Error("INVALID_EVENT_PHASE");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return null;
  }

  await ensureEventApparatusPhases(normalizedEventId, existingEvent.templateId);

  const targetPhase = await db.query.eventPhase.findFirst({
    where: and(
      eq(eventPhase.id, normalizedEventPhaseId),
      eq(eventPhase.eventId, normalizedEventId),
      eq(eventPhase.phaseType, "apparatus_round"),
    ),
  });

  if (!targetPhase) {
    throw new Error("INVALID_EVENT_PHASE");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(eventPhase)
      .set({
        isActive: false,
      })
      .where(
        and(
          eq(eventPhase.eventId, normalizedEventId),
          eq(eventPhase.phaseType, "apparatus_round"),
        ),
      );

    await tx
      .update(eventPhase)
      .set({
        isActive: true,
      })
      .where(eq(eventPhase.id, targetPhase.id));

    await tx
      .update(event)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(event.id, normalizedEventId));
  });

  return getEventDetails(normalizedEventId, normalizedOwnerUserId);
}

export type EventListItem = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listEvents(ownerUserId: string): Promise<EventListItem[]> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);

  return db
    .select({
      id: event.id,
      title: event.title,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    })
    .from(event)
    .where(eq(event.createdByUserId, normalizedOwnerUserId))
    .orderBy(desc(event.createdAt));
}

export type EventDetails = {
  event: EventListItem & { templateId: string; activeContestantId: string | null };
  template: Awaited<ReturnType<typeof getTemplateById>>;
  formValues: Record<string, string>;
  judges: EventJudgeRecord[];
  contestants: EventContestantRecord[];
  eventPhases: EventPhaseRecord[];
  currentEventPhaseId: string | null;
  currentEventPhaseLabel: string | null;
};

export async function getEventDetails(
  eventId: string,
  ownerUserId: string,
): Promise<EventDetails | null> {
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);
  const normalizedEventId = eventId?.trim();

  if (!normalizedEventId) {
    throw new Error("INVALID_EVENT_INPUT");
  }

  const eventRow = await findOwnedEvent(normalizedEventId, normalizedOwnerUserId);

  if (!eventRow) return null;

  const template = await getTemplateById(eventRow.templateId);
  if (!template) return null;

  const fieldValues = await db.query.eventFieldValue.findMany({
    where: eq(eventFieldValue.eventId, normalizedEventId),
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

  const apparatusPhaseContext = await syncEventApparatusPhases(
    normalizedEventId,
    eventRow.templateId,
    buildSelectedOptionByFieldId(
      fieldValues.map((value) => ({
        fieldId: value.fieldId,
        optionId: value.optionId,
      })),
    ),
  );
  const currentEventPhaseId = apparatusPhaseContext.currentEventPhaseId;
  const currentEventPhaseLabel =
    apparatusPhaseContext.phases.find(
      (phase) => phase.id === currentEventPhaseId,
    )?.label ?? null;

  const judgeAssignments = await db.query.eventJudgeAssignment.findMany({
    where: eq(eventJudgeAssignment.eventId, normalizedEventId),
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

  const scoringJudgeAssignments = judgeAssignments.filter((assignment) =>
    currentEventPhaseId
      ? assignment.eventPhaseId === null ||
        assignment.eventPhaseId === currentEventPhaseId
      : assignment.eventPhaseId === null,
  );

  const difficultyBodyAssignments = scoringJudgeAssignments.filter(
    (assignment) =>
      normalizeJudgeTypeName(assignment.judgeType?.name) === "difficulty body",
  );
  const difficultyApparatusAssignments = scoringJudgeAssignments.filter(
    (assignment) =>
      normalizeJudgeTypeName(assignment.judgeType?.name) ===
      "difficulty apparatus",
  );
  const artistryAssignments = scoringJudgeAssignments.filter(
    (assignment) => normalizeJudgeTypeName(assignment.judgeType?.name) === "artistry",
  );
  const executionAssignments = scoringJudgeAssignments.filter(
    (assignment) => normalizeJudgeTypeName(assignment.judgeType?.name) === "execution",
  );
  const timeJudgeAssignments = scoringJudgeAssignments.filter(
    (assignment) => normalizeJudgeTypeName(assignment.judgeType?.name) === "time judge",
  );
  const lineJudgeAssignments = scoringJudgeAssignments.filter(
    (assignment) => normalizeJudgeTypeName(assignment.judgeType?.name) === "line judge",
  );

  const latestScoreRows = await db
    .select({
      contestantId: scoreSheet.contestantId,
      judgeAssignmentId: eventJudgeAssignment.id,
      rawScore: judgeScore.rawScore,
    })
    .from(judgeScore)
    .innerJoin(
      eventJudgeAssignment,
      eq(judgeScore.judgeAssignmentId, eventJudgeAssignment.id),
    )
    .innerJoin(scoreSheet, eq(judgeScore.scoreSheetId, scoreSheet.id))
    .where(
      and(
        eq(scoreSheet.eventId, normalizedEventId),
        eq(eventJudgeAssignment.eventId, normalizedEventId),
        currentEventPhaseId
          ? eq(scoreSheet.eventPhaseId, currentEventPhaseId)
          : isNull(scoreSheet.eventPhaseId),
        currentEventPhaseId
          ? or(
              eq(eventJudgeAssignment.eventPhaseId, currentEventPhaseId),
              isNull(eventJudgeAssignment.eventPhaseId),
            )
          : isNull(eventJudgeAssignment.eventPhaseId),
      ),
    )
    .orderBy(desc(judgeScore.createdAt));

  const latestScoreByContestantAndAssignment = new Map<string, number | null>();

  for (const scoreRow of latestScoreRows) {
    const key = `${scoreRow.contestantId}:${scoreRow.judgeAssignmentId}`;

    if (!latestScoreByContestantAndAssignment.has(key)) {
      latestScoreByContestantAndAssignment.set(key, scoreRow.rawScore);
    }
  }

  const contestantLinks = await db.query.eventContestant.findMany({
    where: eq(eventContestant.eventId, normalizedEventId),
    with: {
      contestant: true,
    },
  });

  const contestants = contestantLinks.map((link) => {
    const contestantId = link.contestant?.id ?? link.contestantId;

    const getScoreValue = (judgeAssignmentId: string) =>
      latestScoreByContestantAndAssignment.get(
        `${contestantId}:${judgeAssignmentId}`,
      ) ?? null;

    const dbScore = computeDifficultyAverageFromValues(
      difficultyBodyAssignments.map((assignment) => getScoreValue(assignment.id)),
      difficultyBodyAssignments.length,
    );
    const daScore = computeDifficultyAverageFromValues(
      difficultyApparatusAssignments.map((assignment) =>
        getScoreValue(assignment.id),
      ),
      difficultyApparatusAssignments.length,
    );

    const dScore = dbScore === null || daScore === null ? null : dbScore + daScore;

    const aScore = computeMedianJudgeTypeScoreFromValues(
      artistryAssignments.map((assignment) => getScoreValue(assignment.id)),
    );
    const eScore = computeMedianJudgeTypeScoreFromValues(
      executionAssignments.map((assignment) => getScoreValue(assignment.id)),
    );

    const totalScore =
      dScore === null || aScore === null || eScore === null
        ? null
        : dScore + aScore + eScore;

    const timePenalty = computePenaltyScoreFromValues(
      timeJudgeAssignments.map((assignment) => getScoreValue(assignment.id)),
      timeJudgeAssignments.length,
    );
    const linePenalty = computePenaltyScoreFromValues(
      lineJudgeAssignments.map((assignment) => getScoreValue(assignment.id)),
      lineJudgeAssignments.length,
    );

    const penalties =
      timePenalty === null || linePenalty === null
        ? null
        : timePenalty + linePenalty;

    const finalScore =
      totalScore === null || penalties === null ? null : totalScore - penalties;

    return {
      id: contestantId,
      fullName: link.contestant?.fullName ?? "",
      teamName: link.contestant?.teamName ?? null,
      gender: link.contestant?.gender ?? null,
      entryNo: link.entryNo,
      dScore,
      aScore,
      eScore,
      penalties,
      totalScore,
      finalScore,
      score: finalScore ?? totalScore,
    };
  });

  return {
    event: {
      id: eventRow.id,
      title: eventRow.title,
      status: eventRow.status,
      createdAt: eventRow.createdAt,
      updatedAt: eventRow.updatedAt,
      templateId: eventRow.templateId,
      activeContestantId: eventRow.activeContestantId ?? null,
    },
    template,
    formValues,
    judges,
    contestants,
    eventPhases: apparatusPhaseContext.phases,
    currentEventPhaseId,
    currentEventPhaseLabel,
  };
}
