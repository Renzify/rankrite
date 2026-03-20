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
} from "./event-details/components/display-control-tab/helpers/liveDisplaySync";

function DisplayView() {
  const isPreview =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "1";

  const [liveState, setLiveState] = useState(() =>
    mergeLiveDisplayState(DEFAULT_LIVE_DISPLAY_STATE, readLiveDisplayState()),
  );

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
      setLiveState((prev) => mergeLiveDisplayState(prev, event.data.payload));
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, []);

  return <LiveDisplayCanvas liveState={liveState} isPreview={isPreview} />;
}

export default DisplayView;