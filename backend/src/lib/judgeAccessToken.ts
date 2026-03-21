import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { ENV } from "./env.ts";

const JUDGE_ACCESS_TOKEN_PURPOSE = "judge_access";
const JUDGE_ACCESS_TOKEN_EXPIRY_DAYS = 90;
const JUDGE_ACCESS_TOKEN_EXPIRY_MS =
  JUDGE_ACCESS_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

type JudgeAccessTokenClaims = JwtPayload & {
  purpose: typeof JUDGE_ACCESS_TOKEN_PURPOSE;
  eventId: string;
  judgeId: string;
};

export type JudgeAccessTokenPayload = {
  eventId: string;
  judgeId: string;
};

function getJudgeAccessSecret() {
  const { JWT_SECRET } = ENV;

  if (!JWT_SECRET) {
    throw new Error("JUDGE_ACCESS_SECRET_NOT_CONFIGURED");
  }

  return JWT_SECRET;
}

function normalizeTokenField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function generateJudgeAccessToken(payload: JudgeAccessTokenPayload) {
  const eventId = normalizeTokenField(payload.eventId);
  const judgeId = normalizeTokenField(payload.judgeId);

  if (!eventId || !judgeId) {
    throw new Error("INVALID_JUDGE_ACCESS_TOKEN_PAYLOAD");
  }

  const token = jwt.sign(
    {
      purpose: JUDGE_ACCESS_TOKEN_PURPOSE,
      eventId,
      judgeId,
    },
    getJudgeAccessSecret(),
    {
      expiresIn: `${JUDGE_ACCESS_TOKEN_EXPIRY_DAYS}d`,
    },
  );

  return {
    accessToken: token,
    expiresAt: new Date(Date.now() + JUDGE_ACCESS_TOKEN_EXPIRY_MS).toISOString(),
  };
}

export function verifyJudgeAccessToken(token: string): JudgeAccessTokenPayload {
  const normalizedToken = normalizeTokenField(token);

  if (!normalizedToken) {
    throw new Error("MISSING_JUDGE_ACCESS_TOKEN");
  }

  try {
    const decoded = jwt.verify(
      normalizedToken,
      getJudgeAccessSecret(),
    ) as JudgeAccessTokenClaims;

    const eventId = normalizeTokenField(decoded.eventId);
    const judgeId = normalizeTokenField(decoded.judgeId);

    if (
      decoded.purpose !== JUDGE_ACCESS_TOKEN_PURPOSE ||
      !eventId ||
      !judgeId
    ) {
      throw new Error("INVALID_JUDGE_ACCESS_TOKEN");
    }

    return {
      eventId,
      judgeId,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      throw new Error("EXPIRED_JUDGE_ACCESS_TOKEN");
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_JUDGE_ACCESS_TOKEN"
    ) {
      throw error;
    }

    throw new Error("INVALID_JUDGE_ACCESS_TOKEN");
  }
}
