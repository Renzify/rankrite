import { io } from "socket.io-client";

export const SOCKET_EVENT_JOIN_ROOM = "event:join";
export const SOCKET_EVENT_LEAVE_ROOM = "event:leave";
export const SOCKET_EVENT_ACTIVE_CONTESTANT_UPDATED =
  "event:active-contestant-updated";
export const SOCKET_EVENT_JUDGE_SCORE_UPDATED = "event:judge-score-updated";
export const SOCKET_EVENT_DISPLAY_CONTROL_SYNC = "event:display-control-sync";
export const SOCKET_EVENT_DISPLAY_CONTROL_UPDATED =
  "event:display-control-updated";

let socketInstance = null;
const roomSubscriberCount = new Map();

function resolveSocketBaseUrl() {
  if (typeof window === "undefined") {
    return "/";
  }

  const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!configuredApiBaseUrl) {
    return window.location.origin;
  }

  try {
    const parsedApiUrl = new URL(configuredApiBaseUrl, window.location.origin);
    return parsedApiUrl.origin;
  } catch {
    return window.location.origin;
  }
}

function normalizeEventId(eventId) {
  const normalizedEventId = String(eventId ?? "").trim();
  return normalizedEventId || null;
}

export function getSocket() {
  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(resolveSocketBaseUrl(), {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  socketInstance.on("connect", () => {
    for (const [eventId, subscriberCount] of roomSubscriberCount.entries()) {
      if (subscriberCount <= 0) continue;

      socketInstance.emit(SOCKET_EVENT_JOIN_ROOM, {
        eventId,
      });
    }
  });

  return socketInstance;
}

export function subscribeToEventRoom(eventId) {
  const normalizedEventId = normalizeEventId(eventId);
  if (!normalizedEventId) return;

  const socket = getSocket();
  const currentSubscriberCount = roomSubscriberCount.get(normalizedEventId) ?? 0;
  roomSubscriberCount.set(normalizedEventId, currentSubscriberCount + 1);

  if (currentSubscriberCount === 0) {
    socket.emit(SOCKET_EVENT_JOIN_ROOM, {
      eventId: normalizedEventId,
    });
  }
}

export function unsubscribeFromEventRoom(eventId) {
  const normalizedEventId = normalizeEventId(eventId);
  if (!normalizedEventId) return;

  const currentSubscriberCount = roomSubscriberCount.get(normalizedEventId);
  if (!currentSubscriberCount) return;

  const socket = getSocket();

  if (currentSubscriberCount === 1) {
    roomSubscriberCount.delete(normalizedEventId);
    socket.emit(SOCKET_EVENT_LEAVE_ROOM, {
      eventId: normalizedEventId,
    });
    return;
  }

  roomSubscriberCount.set(normalizedEventId, currentSubscriberCount - 1);
}
