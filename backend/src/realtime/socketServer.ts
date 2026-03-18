import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.ts";
import { getAuthUserById } from "../services/authService.ts";

type JwtPayload = {
  userId: string;
};

type EventRoomPayload = {
  eventId?: string;
};

export type ActiveContestantUpdatedPayload = {
  eventId: string;
  activeContestantId: string | null;
  updatedAt: string;
};

export type JudgeScoreUpdatedPayload = {
  eventId: string;
  judgeId: string;
  contestantId: string | null;
  contestantName: string | null;
  eventPhaseId: string | null;
  rawScore: number | null;
  locked: boolean;
  submittedAt: string | null;
};

export const SOCKET_EVENT_JOIN_ROOM = "event:join";
export const SOCKET_EVENT_LEAVE_ROOM = "event:leave";
export const SOCKET_EVENT_ACTIVE_CONTESTANT_UPDATED =
  "event:active-contestant-updated";
export const SOCKET_EVENT_JUDGE_SCORE_UPDATED = "event:judge-score-updated";

const AUTH_COOKIE_NAME = "jwt";
const EVENT_ROOM_PREFIX = "event:";

let io: SocketIOServer | null = null;

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, "");
}

function buildAllowedOrigins() {
  const configuredOrigins = (ENV.CLIENT_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set(configuredOrigins.map(normalizeOrigin));

  for (const origin of configuredOrigins) {
    try {
      const parsedUrl = new URL(origin);
      const hostName = parsedUrl.hostname;
      const port = parsedUrl.port;

      if (hostName === "localhost") {
        const localhostVariant = `http://127.0.0.1${port ? `:${port}` : ""}`;
        const localhostVariantSecure = `https://127.0.0.1${port ? `:${port}` : ""}`;
        allowedOrigins.add(localhostVariant);
        allowedOrigins.add(localhostVariantSecure);
      }

      if (hostName === "127.0.0.1") {
        const loopbackVariant = `http://localhost${port ? `:${port}` : ""}`;
        const loopbackVariantSecure = `https://localhost${port ? `:${port}` : ""}`;
        allowedOrigins.add(loopbackVariant);
        allowedOrigins.add(loopbackVariantSecure);
      }
    } catch {
      // Ignore invalid CLIENT_URL entries.
    }
  }

  return allowedOrigins;
}

const ALLOWED_ORIGINS = buildAllowedOrigins();

function isSocketOriginAllowed(origin: string | undefined) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.size === 0) return true;

  return ALLOWED_ORIGINS.has(normalizeOrigin(origin));
}

function getCookieValue(cookieHeader: string | undefined, key: string) {
  if (!cookieHeader) return null;

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [rawName, ...rawValueParts] = pair.trim().split("=");
    if (!rawName || !rawValueParts.length) continue;
    if (rawName !== key) continue;

    return rawValueParts.join("=");
  }

  return null;
}

function normalizeEventId(rawEventId: string | undefined | null) {
  const normalizedEventId = (rawEventId ?? "").toString().trim();
  return normalizedEventId || null;
}

function getEventRoomName(eventId: string) {
  return `${EVENT_ROOM_PREFIX}${eventId}`;
}

async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void,
) {
  try {
    const token = getCookieValue(
      socket.handshake.headers.cookie,
      AUTH_COOKIE_NAME,
    );

    if (!token) {
      return next(new Error("Unauthorized - No token provided"));
    }

    const { JWT_SECRET } = ENV;
    if (!JWT_SECRET) {
      return next(new Error("Server authentication is not configured"));
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return next(new Error("Unauthorized - Invalid token"));
    }

    if (!decoded?.userId || typeof decoded.userId !== "string") {
      return next(new Error("Unauthorized - Invalid token"));
    }

    const authenticatedUser = await getAuthUserById(decoded.userId);
    if (!authenticatedUser) {
      return next(new Error("Unauthorized - User not found"));
    }

    socket.data.userId = authenticatedUser.id;
    return next();
  } catch (error) {
    console.error("Socket authentication failed:", error);
    return next(new Error("Socket authentication failed"));
  }
}

function emitToEventRoom(
  eventId: string,
  eventName: string,
  payload: Record<string, unknown>,
) {
  const normalizedEventId = normalizeEventId(eventId);
  if (!io || !normalizedEventId) return;

  io.to(getEventRoomName(normalizedEventId)).emit(eventName, payload);
}

export function initSocketServer(httpServer: HttpServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isSocketOriginAllowed(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Socket CORS blocked for origin: " + origin));
      },
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    socket.on(SOCKET_EVENT_JOIN_ROOM, (payload?: EventRoomPayload) => {
      const eventId = normalizeEventId(payload?.eventId);
      if (!eventId) return;

      socket.join(getEventRoomName(eventId));
    });

    socket.on(SOCKET_EVENT_LEAVE_ROOM, (payload?: EventRoomPayload) => {
      const eventId = normalizeEventId(payload?.eventId);
      if (!eventId) return;

      socket.leave(getEventRoomName(eventId));
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}

export function emitActiveContestantUpdated(
  payload: ActiveContestantUpdatedPayload,
) {
  emitToEventRoom(
    payload.eventId,
    SOCKET_EVENT_ACTIVE_CONTESTANT_UPDATED,
    payload,
  );
}

export function emitJudgeScoreUpdated(payload: JudgeScoreUpdatedPayload) {
  emitToEventRoom(payload.eventId, SOCKET_EVENT_JUDGE_SCORE_UPDATED, payload);
}
