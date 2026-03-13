import { useEffect, useState } from "react";
import {
  LIVE_DISPLAY_CHANNEL_NAME,
  LIVE_DISPLAY_MESSAGE_TYPE,
  LIVE_DISPLAY_STORAGE_KEY,
  readLiveDisplayState,
} from "./event-details/components/display-control-tab/helpers/liveDisplaySync";

const DEFAULT_LIVE_STATE = {
  eventName: "Gymnastics Competition",
  category: "Aerobic Gymnastics",
  division: "Individual Women",
  contestant: {
    name: "Awaiting contestant",
    delegation: "-",
    score: "--",
  },
  isBlackout: false,
  isFrozen: false,
};

function InfoItem({ label, value, isPreview = false }) {
  return (
    <div
      className={`flex min-w-0 w-full flex-col items-center justify-center text-center ${
        isPreview ? "px-2" : "px-4 sm:px-6"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 font-bold leading-tight text-slate-100 ${
          isPreview ? "text-sm md:text-base" : "text-2xl md:text-3xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function mergeLiveState(base, incoming) {
  return {
    ...base,
    ...incoming,
    contestant: {
      ...base.contestant,
      ...(incoming?.contestant ?? {}),
    },
  };
}

function DisplayView() {
  const isPreview =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "1";

  const [liveState, setLiveState] = useState(() =>
    mergeLiveState(DEFAULT_LIVE_STATE, readLiveDisplayState()),
  );

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== LIVE_DISPLAY_STORAGE_KEY || !event.newValue) return;

      try {
        const parsed = JSON.parse(event.newValue);
        setLiveState((prev) => mergeLiveState(prev, parsed));
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
      setLiveState((prev) => mergeLiveState(prev, event.data.payload));
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, []);

  if (liveState.isBlackout) {
    return (
      <div
        className={`flex items-center justify-center bg-black text-white ${
          isPreview ? "min-h-screen overflow-hidden" : "min-h-screen"
        }`}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
            Live Display
          </p>
          <h1
            className={`mt-3 font-extrabold tracking-tight ${
              isPreview ? "text-3xl md:text-5xl" : "text-5xl md:text-7xl"
            }`}
          >
            BLACKOUT ACTIVE
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-950 text-slate-100 ${
        isPreview ? "min-h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[1800px] flex-col ${
          isPreview
            ? "min-h-screen px-4 py-3 md:px-5 md:py-4"
            : "min-h-screen px-5 py-6 md:px-8 md:py-8 lg:px-10"
        }`}
      >
        <header
          className={`border-b border-cyan-300/25 text-center ${
            isPreview ? "pb-3" : "pb-5"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
              Live Competition Feed
            </p>
          </div>
          <h1
            className={`mt-2 font-bold tracking-tight ${
              isPreview ? "text-sm md:text-lg" : "text-3xl md:text-5xl"
            }`}
          >
            {liveState.eventName}
          </h1>
        </header>

        <main
          className={`flex flex-1 items-center justify-center ${
            isPreview ? "py-4 md:py-5" : "py-8 md:py-10"
          }`}
        >
          <section className="w-full text-center">
            <p
              className={`font-semibold uppercase tracking-[0.16em] text-cyan-200/85 ${
                isPreview ? "text-[10px]" : "text-xs"
              }`}
            >
              Current Contestant
            </p>

            <h2
              className={`mt-4 font-extrabold leading-[0.95] tracking-tight text-white ${
                isPreview
                  ? "text-[clamp(2.25rem,7vw,4.75rem)]"
                  : "text-[clamp(4rem,8vw,12rem)]"
              }`}
            >
              {liveState.contestant.name}
            </h2>

            <div
              className={`mt-8 border-y border-white/15 ${
                isPreview ? "py-3" : "py-5"
              }`}
            >
              <div
                className={
                  isPreview
                    ? "grid grid-cols-3 items-start gap-0"
                    : "grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0"
                }
              >
                <InfoItem
                  label="Delegation"
                  value={liveState.contestant.delegation}
                  isPreview={isPreview}
                />
                <InfoItem
                  label="Divison Level"
                  value="School Level"
                  isPreview={isPreview}
                />
                <InfoItem
                  label="Apparatus"
                  value="Individual Floor"
                  isPreview={isPreview}
                />
              </div>
            </div>

            <p
              className={`font-semibold uppercase tracking-[0.14em] text-cyan-200/80 ${
                isPreview ? "mt-4 text-[10px]" : "mt-8 text-xs"
              }`}
            >
              Score
            </p>
            <p
              className={`mt-2 font-extrabold leading-none tracking-tight text-cyan-300 ${
                isPreview
                  ? "text-[clamp(2.4rem,6.5vw,5rem)]"
                  : "text-[clamp(3.75rem,10vw,10rem)]"
              }`}
            >
              {liveState.contestant.score}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DisplayView;
