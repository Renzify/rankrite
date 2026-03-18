import { useEffect, useRef } from "react";
import { getEventDetails } from "../../../../../api/eventApi";
import {
  getSocket,
  SOCKET_EVENT_ACTIVE_CONTESTANT_UPDATED,
  SOCKET_EVENT_JUDGE_SCORE_UPDATED,
  subscribeToEventRoom,
  unsubscribeFromEventRoom,
} from "../../../../../shared/lib/socket";
import {
  LIVE_DISPLAY_CHANNEL_NAME,
  LIVE_DISPLAY_MESSAGE_TYPE,
  writeLiveDisplayState,
} from "../helpers/liveDisplaySync";

const POLL_INTERVAL_MS = 3000;

export default function useDisplayControlEffects({
  eventId,
  liveDisplayPayload,
  setContestants,
  viewMode,
  isAutoRunning,
  isFrozen,
  isBlackout,
  contestantsLength,
  swapSeconds,
  setActiveIndex,
}) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof BroadcastChannel === "undefined") return;

    channelRef.current = new BroadcastChannel(LIVE_DISPLAY_CHANNEL_NAME);

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    writeLiveDisplayState(liveDisplayPayload);

    channelRef.current?.postMessage({
      type: LIVE_DISPLAY_MESSAGE_TYPE,
      payload: liveDisplayPayload,
    });
  }, [liveDisplayPayload]);

  useEffect(() => {
    if (!eventId) return undefined;

    let isMounted = true;

    const mapContestantForDisplay = (contestant) => ({
      ...contestant,
      teamName: contestant.teamName ?? contestant.delegation ?? "",
      delegation: contestant.teamName ?? contestant.delegation ?? "",
    });

    const refreshContestantScores = async () => {
      try {
        const latestEventDetails = await getEventDetails(eventId);
        if (!isMounted) return;

        const latestContestants = (latestEventDetails?.contestants ?? []).map(
          mapContestantForDisplay,
        );
        setContestants(latestContestants);
      } catch (error) {
        console.error("Failed to refresh live display contestant scores:", error);
      }
    };

    refreshContestantScores();

    const pollId = window.setInterval(() => {
      refreshContestantScores();
    }, POLL_INTERVAL_MS);

    const onWindowFocus = () => {
      refreshContestantScores();
    };

    const socket = getSocket();
    const handleRealtimeRefresh = (payload) => {
      if (payload?.eventId && payload.eventId !== eventId) return;
      refreshContestantScores();
    };

    subscribeToEventRoom(eventId);
    window.addEventListener("focus", onWindowFocus);
    socket.on(SOCKET_EVENT_ACTIVE_CONTESTANT_UPDATED, handleRealtimeRefresh);
    socket.on(SOCKET_EVENT_JUDGE_SCORE_UPDATED, handleRealtimeRefresh);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
      window.removeEventListener("focus", onWindowFocus);
      socket.off(SOCKET_EVENT_ACTIVE_CONTESTANT_UPDATED, handleRealtimeRefresh);
      socket.off(SOCKET_EVENT_JUDGE_SCORE_UPDATED, handleRealtimeRefresh);
      unsubscribeFromEventRoom(eventId);
    };
  }, [eventId, setContestants]);

  useEffect(() => {
    if (viewMode !== "auto") return;
    if (!isAutoRunning) return;
    if (isFrozen || isBlackout) return;
    if (contestantsLength < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % contestantsLength);
    }, swapSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [
    viewMode,
    isAutoRunning,
    isFrozen,
    isBlackout,
    swapSeconds,
    contestantsLength,
    setActiveIndex,
  ]);
}
