import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";
import {
  getJudgeAccessContext,
  createJudgeAccessLink,
  submitJudgeAccessScore,
} from "../services/judgeAccessService.ts";
import {
  verifyJudgeAccessToken,
  type JudgeAccessTokenPayload,
} from "../lib/judgeAccessToken.ts";
import { emitJudgeScoreUpdated } from "../realtime/socketServer.ts";

function getRouteParamId(req: Request, key = "id") {
  const rawId = req.params[key];
  return Array.isArray(rawId) ? rawId[0] : rawId;
}

function getAuthenticatedUserId(req: Request) {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;

  if (typeof userId !== "string" || userId.trim() === "") {
    return null;
  }

  return userId;
}

function extractJudgeAccessToken(req: Request) {
  const authorizationHeader = req.get("authorization") ?? "";

  if (!authorizationHeader.startsWith("Bearer ")) {
    throw new Error("MISSING_JUDGE_ACCESS_TOKEN");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

function getJudgeAccessPayload(req: Request): JudgeAccessTokenPayload {
  return verifyJudgeAccessToken(extractJudgeAccessToken(req));
}

function toIsoTimestamp(value: Date | string | null | undefined) {
  if (!value) return null;

  const normalizedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(normalizedDate.getTime())) return null;

  return normalizedDate.toISOString();
}

export async function createJudgeAccessLinkController(
  req: Request,
  res: Response,
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = getRouteParamId(req);
    const judgeId = getRouteParamId(req, "judgeId");

    if (typeof eventId !== "string" || typeof judgeId !== "string") {
      return res.status(400).json({
        message: "Event id and judge id are required",
      });
    }

    const linkPayload = await createJudgeAccessLink(eventId, userId, judgeId);

    if (!linkPayload) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    return res.status(200).json(linkPayload);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_JUDGE_ACCESS_LINK_INPUT"
    ) {
      return res.status(400).json({
        message: "Event id and judge id are required",
      });
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_JUDGE_ACCESS_LINK_CONTEXT"
    ) {
      return res.status(400).json({
        message: "Judge is not assigned to this event",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to generate secure judge access link",
    });
  }
}

export async function getJudgeAccessContextController(
  req: Request,
  res: Response,
) {
  try {
    const accessPayload = getJudgeAccessPayload(req);
    const context = await getJudgeAccessContext(accessPayload);

    if (!context) {
      return res.status(404).json({
        message: "Judge access is no longer available",
      });
    }

    return res.status(200).json(context);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "MISSING_JUDGE_ACCESS_TOKEN"
    ) {
      return res.status(401).json({
        message: "Judge access token is required",
      });
    }

    if (
      error instanceof Error &&
      error.message === "EXPIRED_JUDGE_ACCESS_TOKEN"
    ) {
      return res.status(401).json({
        message: "This judge access link has expired",
      });
    }

    if (
      error instanceof Error &&
      (error.message === "INVALID_JUDGE_ACCESS_TOKEN" ||
        error.message === "INVALID_JUDGE_ACCESS_CONTEXT")
    ) {
      return res.status(403).json({
        message: "This judge access link is invalid",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_PHASE") {
      return res.status(400).json({
        message: "Invalid event phase for this judge access link",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to load judge access",
    });
  }
}

export async function submitJudgeAccessScoreController(
  req: Request,
  res: Response,
) {
  try {
    const accessPayload = getJudgeAccessPayload(req);
    const payload = req.body as {
      contestantId?: string;
      score?: number | string;
    };

    const submittedScore = await submitJudgeAccessScore(accessPayload, payload);

    if (!submittedScore) {
      return res.status(404).json({
        message: "Judge access is no longer available",
      });
    }

    emitJudgeScoreUpdated({
      eventId: accessPayload.eventId,
      judgeId: submittedScore.judgeId,
      contestantId: submittedScore.contestantId ?? null,
      contestantName: submittedScore.contestantName ?? null,
      eventPhaseId: submittedScore.eventPhaseId ?? null,
      rawScore: submittedScore.rawScore ?? null,
      locked: Boolean(submittedScore.locked),
      submittedAt: toIsoTimestamp(submittedScore.submittedAt),
    });

    return res.status(201).json(submittedScore);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "MISSING_JUDGE_ACCESS_TOKEN"
    ) {
      return res.status(401).json({
        message: "Judge access token is required",
      });
    }

    if (
      error instanceof Error &&
      error.message === "EXPIRED_JUDGE_ACCESS_TOKEN"
    ) {
      return res.status(401).json({
        message: "This judge access link has expired",
      });
    }

    if (
      error instanceof Error &&
      (error.message === "INVALID_JUDGE_ACCESS_TOKEN" ||
        error.message === "INVALID_JUDGE_ACCESS_CONTEXT")
    ) {
      return res.status(403).json({
        message: "This judge access link is invalid",
      });
    }

    if (error instanceof Error && error.message === "INVALID_JUDGE_SCORE_INPUT") {
      return res.status(400).json({
        message:
          "Judge score must include the current contestant and a valid numeric score",
      });
    }

    if (error instanceof Error && error.message === "INVALID_JUDGE_SCORE_CONTEXT") {
      return res.status(400).json({
        message: "Judge or contestant is not assigned to this event",
      });
    }

    if (error instanceof Error && error.message === "NO_ACTIVE_CONTESTANT") {
      return res.status(409).json({
        message: "There is no active contestant available for scoring right now",
      });
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_ACTIVE_CONTESTANT_ACCESS"
    ) {
      return res.status(409).json({
        message: "Only the current active contestant can be scored",
      });
    }

    if (error instanceof Error && error.message === "JUDGE_SCORE_LOCKED") {
      return res.status(409).json({
        message: "This judge submission is locked and can no longer be edited",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EVENT_PHASE") {
      return res.status(400).json({
        message: "Invalid event phase for this event",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to submit judge score",
    });
  }
}
