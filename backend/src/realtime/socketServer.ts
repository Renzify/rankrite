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
const USER_ROOM_PREFIX = "user:";

let io: SocketIOServer | null = null;

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

function getUserRoomName(userId: string) {
  return `${USER_ROOM_PREFIX}${userId}`;
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

function emitToUserRoom(
  userId: string,
  eventName: string,
  payload: Record<string, unknown>,
) {
  const normalizedUserId = (userId ?? "").toString().trim();
  if (!io || !normalizedUserId) return;

  io.to(getUserRoomName(normalizedUserId)).emit(eventName, payload);
}

export function initSocketServer(httpServer: HttpServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ENV.CLIENT_URL ?? true,
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const normalizedUserId = (socket.data.userId ?? "").toString().trim();
    if (normalizedUserId) {
      socket.join(getUserRoomName(normalizedUserId));
    }

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
  userId?: string,
) {
  emitToEventRoom(
    payload.eventId,
    SOCKET_EVENT_ACTIVE_CONTESTANT_UPDATED,
    payload,
  );

  if (userId) {
    emitToUserRoom(userId, SOCKET_EVENT_ACTIVE_CONTESTANT_UPDATED, payload);
  }
}

export function emitJudgeScoreUpdated(
  payload: JudgeScoreUpdatedPayload,
  userId?: string,
) {
  emitToEventRoom(payload.eventId, SOCKET_EVENT_JUDGE_SCORE_UPDATED, payload);

  if (userId) {
    emitToUserRoom(userId, SOCKET_EVENT_JUDGE_SCORE_UPDATED, payload);
  }
}
