import { useEffect, useState } from "react";
import LiveDisplayCanvas from "./event-details/components/display-control-tab/components/LiveDisplayCanvas";
import {
  DEFAULT_LIVE_DISPLAY_STATE,
  mergeLiveDisplayState,
} from "./event-details/components/display-control-tab/helpers/liveDisplayState";
import {
  LIVE_DISPLAY_CHANNEL_NAME,
  LIVE_DISPLAY_MESSAGE_TYPE,
  LIVE_DISPLAY_STORAGE_KEY,
  readLiveDisplayState,
  writeLiveDisplayState,
} from "./event-details/components/display-control-tab/helpers/liveDisplaySync";
import {
  getSocket,
  SOCKET_EVENT_DISPLAY_CONTROL_UPDATED,
  subscribeToEventRoom,
  unsubscribeFromEventRoom,
} from "../shared/lib/socket";

function DisplayView() {
  const isPreview =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "1";
  const queryEventId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("eventId") ?? ""
      : "";

  const [liveState, setLiveState] = useState(() => {
    const storedState = readLiveDisplayState();

    return mergeLiveDisplayState(DEFAULT_LIVE_DISPLAY_STATE, {
      ...storedState,
      eventId: queryEventId || storedState?.eventId || "",
    });
  });

  const activeEventId = String(queryEventId || liveState?.eventId || "").trim();

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== LIVE_DISPLAY_STORAGE_KEY || !event.newValue) return;

      try {
        const parsed = JSON.parse(event.newValue);
        setLiveState((prev) => mergeLiveDisplayState(prev, parsed));
      } catch {
        // Ignore invalid payload.
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(LIVE_DISPLAY_CHANNEL_NAME);

    const handleMessage = (event) => {
      if (event.data?.type !== LIVE_DISPLAY_MESSAGE_TYPE) return;
      writeLiveDisplayState(event.data.payload);
      setLiveState((prev) => mergeLiveDisplayState(prev, event.data.payload));
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, []);

  useEffect(() => {
    if (!activeEventId) return undefined;

    const socket = getSocket();
    const handleRealtimeLiveDisplaySync = (payload) => {
      const payloadEventId = String(payload?.eventId ?? "").trim();
      if (!payloadEventId || payloadEventId !== activeEventId) return;

      const incomingState = payload?.displayState;
      if (!incomingState || typeof incomingState !== "object") return;
      if (Array.isArray(incomingState)) return;

      writeLiveDisplayState(incomingState);
      setLiveState((previousState) =>
        mergeLiveDisplayState(previousState, incomingState),
      );
    };

    subscribeToEventRoom(activeEventId);
    socket.on(SOCKET_EVENT_DISPLAY_CONTROL_UPDATED, handleRealtimeLiveDisplaySync);

    return () => {
      socket.off(
        SOCKET_EVENT_DISPLAY_CONTROL_UPDATED,
        handleRealtimeLiveDisplaySync,
      );
      unsubscribeFromEventRoom(activeEventId);
    };
  }, [activeEventId]);

  return <LiveDisplayCanvas liveState={liveState} isPreview={isPreview} />;
}

export default DisplayView;
