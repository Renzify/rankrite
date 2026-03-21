import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  contestant,
  event,
  eventContestant,
  eventJudgeAssignment,
  eventPhase,
  judge,
  judgeScore,
  judgeType,
  scoreSheet,
} from "../db/schema.ts";
import {
  generateJudgeAccessToken,
  type JudgeAccessTokenPayload,
} from "../lib/judgeAccessToken.ts";

export type JudgeAccessContext = {
  event: {
    id: string;
    title: string;
    activeContestantId: string | null;
    status: string;
  };
  judge: {
    id: string;
    fullName: string;
    judgeType: string;
    judgeNumber: number;
    eventPhaseId: string | null;
  };
  contestants: Array<{
    id: string;
    fullName: string;
    teamName: string | null;
    entryNo: number;
  }>;
  judgeScores: Array<{
    judgeId: string;
    contestantId: string | null;
    contestantName: string | null;
    eventPhaseId: string | null;
    rawScore: number | null;
    locked: boolean;
    submittedAt: Date | null;
  }>;
};

type SubmitJudgeAccessScoreInput = {
  contestantId?: string;
  score?: number | string;
};

function normalizeId(value: string | null | undefined) {
  return (value ?? "").trim();
}

function normalizeUserId(value: string) {
  const normalizedValue = normalizeId(value);

  if (!normalizedValue) {
    throw new Error("INVALID_AUTH_CONTEXT");
  }

  return normalizedValue;
}

async function findOwnedEvent(eventId: string, ownerUserId: string) {
  return db.query.event.findFirst({
    where: and(eq(event.id, eventId), eq(event.createdByUserId, ownerUserId)),
  });
}

async function findEventById(eventId: string) {
  return db.query.event.findFirst({
    where: eq(event.id, eventId),
  });
}

async function resolveEventPhaseForScoring(
  eventId: string,
  requestedEventPhaseId?: string | null,
) {
  const normalizedRequestedEventPhaseId = normalizeId(requestedEventPhaseId);

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
      candidateAssignments.find(
        (assignment) => assignment.eventPhaseId === null,
      ) ??
      null
    );
  }

  return (
    candidateAssignments.find((assignment) => assignment.eventPhaseId === null) ??
    null
  );
}

async function listJudgeScoresForAccess(
  eventId: string,
  judgeId: string,
  scoringEventPhaseId: string | null,
) {
  const assignmentPhaseCondition = scoringEventPhaseId
    ? or(
        eq(eventJudgeAssignment.eventPhaseId, scoringEventPhaseId),
        isNull(eventJudgeAssignment.eventPhaseId),
      )
    : isNull(eventJudgeAssignment.eventPhaseId);
  const scoreSheetPhaseCondition = scoringEventPhaseId
    ? eq(scoreSheet.eventPhaseId, scoringEventPhaseId)
    : isNull(scoreSheet.eventPhaseId);

  const scoreRows = await db
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
      and(
        eq(scoreSheet.eventId, eventId),
        eq(eventJudgeAssignment.judgeId, judgeId),
        assignmentPhaseCondition,
        scoreSheetPhaseCondition,
      ),
    )
    .orderBy(desc(judgeScore.createdAt));

  const latestScoreByContestantId = new Map<string, (typeof scoreRows)[number]>();

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
    locked: Boolean(scoreRow.locked),
    submittedAt: scoreRow.submittedAt,
  }));
}

export async function createJudgeAccessLink(
  eventId: string,
  ownerUserId: string,
  judgeId: string,
) {
  const normalizedEventId = normalizeId(eventId);
  const normalizedJudgeId = normalizeId(judgeId);
  const normalizedOwnerUserId = normalizeUserId(ownerUserId);

  if (!normalizedEventId || !normalizedJudgeId) {
    throw new Error("INVALID_JUDGE_ACCESS_LINK_INPUT");
  }

  const existingEvent = await findOwnedEvent(
    normalizedEventId,
    normalizedOwnerUserId,
  );

  if (!existingEvent) {
    return null;
  }

  const assignment = await db.query.eventJudgeAssignment.findFirst({
    where: and(
      eq(eventJudgeAssignment.eventId, normalizedEventId),
      eq(eventJudgeAssignment.judgeId, normalizedJudgeId),
    ),
  });

  if (!assignment) {
    throw new Error("INVALID_JUDGE_ACCESS_LINK_CONTEXT");
  }

  return generateJudgeAccessToken({
    eventId: normalizedEventId,
    judgeId: normalizedJudgeId,
  });
}

export async function getJudgeAccessContext(
  payload: JudgeAccessTokenPayload,
): Promise<JudgeAccessContext | null> {
  const normalizedEventId = normalizeId(payload.eventId);
  const normalizedJudgeId = normalizeId(payload.judgeId);

  if (!normalizedEventId || !normalizedJudgeId) {
    throw new Error("INVALID_JUDGE_ACCESS_CONTEXT");
  }

  const existingEvent = await findEventById(normalizedEventId);

  if (!existingEvent) {
    return null;
  }

  const scoringEventPhaseId = await resolveEventPhaseForScoring(normalizedEventId);
  const assignment = await resolveJudgeAssignmentForScoring(
    normalizedEventId,
    normalizedJudgeId,
    scoringEventPhaseId,
  );

  if (!assignment) {
    throw new Error("INVALID_JUDGE_ACCESS_CONTEXT");
  }

  const [judgeRecord, contestantRows, judgeScores] = await Promise.all([
    db
      .select({
        id: judge.id,
        fullName: judge.fullName,
        judgeType: judgeType.name,
        judgeNumber: eventJudgeAssignment.judgeNumber,
        eventPhaseId: eventJudgeAssignment.eventPhaseId,
      })
      .from(eventJudgeAssignment)
      .innerJoin(judge, eq(eventJudgeAssignment.judgeId, judge.id))
      .innerJoin(judgeType, eq(eventJudgeAssignment.judgeTypeId, judgeType.id))
      .where(eq(eventJudgeAssignment.id, assignment.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({
        id: contestant.id,
        fullName: contestant.fullName,
        teamName: contestant.teamName,
        entryNo: eventContestant.entryNo,
      })
      .from(eventContestant)
      .innerJoin(contestant, eq(eventContestant.contestantId, contestant.id))
      .where(eq(eventContestant.eventId, normalizedEventId))
      .orderBy(asc(eventContestant.entryNo), asc(contestant.fullName)),
    listJudgeScoresForAccess(
      normalizedEventId,
      normalizedJudgeId,
      scoringEventPhaseId,
    ),
  ]);

  if (!judgeRecord) {
    throw new Error("INVALID_JUDGE_ACCESS_CONTEXT");
  }

  return {
    event: {
      id: existingEvent.id,
      title: existingEvent.title,
      activeContestantId: existingEvent.activeContestantId,
      status: existingEvent.status,
    },
    judge: judgeRecord,
    contestants: contestantRows,
    judgeScores,
  };
}

export async function submitJudgeAccessScore(
  payload: JudgeAccessTokenPayload,
  input: SubmitJudgeAccessScoreInput,
) {
  const normalizedEventId = normalizeId(payload.eventId);
  const normalizedJudgeId = normalizeId(payload.judgeId);
  const normalizedContestantId = normalizeId(input.contestantId);
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

  const existingEvent = await findEventById(normalizedEventId);

  if (!existingEvent) {
    return null;
  }

  if (!existingEvent.activeContestantId) {
    throw new Error("NO_ACTIVE_CONTESTANT");
  }

  if (existingEvent.activeContestantId !== normalizedContestantId) {
    throw new Error("INVALID_ACTIVE_CONTESTANT_ACCESS");
  }

  const scoringEventPhaseId = await resolveEventPhaseForScoring(normalizedEventId);

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
