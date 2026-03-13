import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import {
  LIVE_DISPLAY_CHANNEL_NAME,
  LIVE_DISPLAY_MESSAGE_TYPE,
  formatLiveLabel,
  writeLiveDisplayState,
} from "./helpers/liveDisplaySync";

const VIEW_MODE_OPTIONS = [
  {
    value: "manual",
    label: "Manual Swapping",
    description: "Operator advances the audience display manually.",
  },
  {
    value: "auto",
    label: "Automatic Swapping",
    description:
      "Rotate contestants automatically using the selected interval.",
  },
];

const FREEZE_OPTIONS = [
  {
    value: "live",
    label: "Live",
    description: "Display updates normally.",
  },
  {
    value: "frozen",
    label: "Frozen",
    description: "Hold the current frame on screen.",
  },
];

const OUTPUT_OPTIONS = [
  {
    value: "visible",
    label: "Visible",
    description: "Audience can see the live display.",
  },
  {
    value: "blackout",
    label: "Blackout",
    description: "Hide the audience output immediately.",
  },
];

export default function DisplayControlTab() {
  const { eventTitle, selectedEventType, selectedSport, contestants } =
    useOutletContext();

  const [viewMode, setViewMode] = useState("manual");
  const [activeIndex, setActiveIndex] = useState(0);
  const [swapSeconds, setSwapSeconds] = useState(5);
  const [isAutoRunning, setIsAutoRunning] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);

  const channelRef = useRef(null);

  const hasContestants = contestants.length > 0;
  const safeActiveIndex = hasContestants
    ? Math.min(activeIndex, contestants.length - 1)
    : 0;

  const activeContestant = hasContestants ? contestants[safeActiveIndex] : null;

  const nextIndex = hasContestants
    ? (safeActiveIndex + 1) % contestants.length
    : 0;

  const liveDisplayPayload = useMemo(() => {
    const scoreValue =
      activeContestant?.score ??
      activeContestant?.totalScore ??
      activeContestant?.finalScore ??
      "--";

    return {
      eventName: eventTitle || "Gymnastics Competition",
      category: formatLiveLabel(selectedEventType, "Aerobic Gymnastics"),
      division: formatLiveLabel(selectedSport, "Individual Women"),
      contestant: {
        name:
          activeContestant?.fullName ||
          activeContestant?.name ||
          "Awaiting contestant",
        delegation:
          activeContestant?.delegation || activeContestant?.teamName || "-",
        score: String(scoreValue),
      },
      isBlackout,
      isFrozen,
      mode: viewMode,
      updatedAt: new Date().toISOString(),
    };
  }, [
    activeContestant,
    eventTitle,
    isBlackout,
    isFrozen,
    selectedEventType,
    selectedSport,
    viewMode,
  ]);

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
    if (viewMode !== "auto") return;
    if (!isAutoRunning) return;
    if (isFrozen || isBlackout) return;
    if (contestants.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % contestants.length);
    }, swapSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [
    viewMode,
    isAutoRunning,
    isFrozen,
    isBlackout,
    swapSeconds,
    contestants.length,
  ]);

  const handlePrev = () => {
    if (!hasContestants || isFrozen || isBlackout) return;
    setActiveIndex((prev) => (prev === 0 ? contestants.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (!hasContestants || isFrozen || isBlackout) return;
    setActiveIndex((prev) => (prev + 1) % contestants.length);
  };

  const handleOpenLiveDisplay = () => {
    window.open("/live-display", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Display Control
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="badge badge-outline">
            {viewMode === "manual" ? "Manual Swapping" : "Automatic Swapping "}
          </div>
          {isFrozen ? <div className="badge badge-warning">Frozen</div> : null}
          {isBlackout ? (
            <div className="badge badge-error">Blackout</div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <div className="app-surface p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
              Live Display Preview
            </p>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={handleOpenLiveDisplay}
            >
              Open Live Display
            </button>
          </div>

          <div className="mt-4 flex justify-center rounded-3xl border border-base-300 bg-slate-900/80 p-5 md:p-6">
            <div className="w-full max-w-[920px] rounded-[2rem] border border-slate-700 bg-slate-950 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <div className="mb-3 flex items-center justify-between px-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                <span>Live Feed</span>
                {isFrozen ? (
                  <span className="badge badge-warning badge-sm">Frozen</span>
                ) : null}
              </div>
              <div className="overflow-hidden rounded-[1.25rem] border border-slate-800 bg-black">
                <div className="aspect-video w-full">
                  <iframe
                    title="Live display preview"
                    src="/live-display?preview=1"
                    className="h-full w-full bg-slate-950"
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-base-content/70">
            This preview renders the live display and updates in real time.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="app-muted-panel">
            <h3 className="font-semibold">Viewing Mode</h3>

            <fieldset className="mt-3 space-y-2">
              {VIEW_MODE_OPTIONS.map((option) => {
                const isSelected = viewMode === option.value;

                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                      isSelected
                        ? "border-base-content/30 bg-base-100"
                        : "border-base-300/70 bg-base-200/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="view-mode"
                      className="radio radio-sm mt-0.5"
                      checked={isSelected}
                      onChange={() => setViewMode(option.value)}
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="block text-xs text-base-content/70">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {viewMode === "manual" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handlePrev}
                  disabled={!hasContestants || isFrozen || isBlackout}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-neutral"
                  onClick={handleNext}
                  disabled={!hasContestants || isFrozen || isBlackout}
                >
                  Next
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="form-control w-full max-w-xs">
                  <div className="label pb-1">
                    <span className="label-text">Auto swap interval</span>
                  </div>
                  <select
                    className="select select-bordered select-sm mb-4"
                    value={swapSeconds}
                    onChange={(event) =>
                      setSwapSeconds(Number(event.target.value))
                    }
                  >
                    <option value={3}>3 seconds</option>
                    <option value={5}>5 seconds</option>
                    <option value={8}>8 seconds</option>
                    <option value={10}>10 seconds</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="btn btn-sm btn-neutral"
                  onClick={() => setIsAutoRunning((prev) => !prev)}
                  disabled={!hasContestants || contestants.length < 2}
                >
                  {isAutoRunning ? "Pause Auto Swap" : "Resume Auto Swap"}
                </button>
              </div>
            )}
          </div>

          <div className="app-muted-panel">
            <h3 className="font-semibold">Emergency Controls</h3>
            <div className="mt-3 space-y-4">
              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/60">
                  Freeze State
                </legend>
                {FREEZE_OPTIONS.map((option) => {
                  const isSelected =
                    option.value === "frozen" ? isFrozen : !isFrozen;

                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                        isSelected
                          ? "border-warning/40 bg-warning/10"
                          : "border-base-300/70 bg-base-200/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="freeze-state"
                        className="radio radio-sm radio-warning mt-0.5"
                        checked={isSelected}
                        onChange={() => setIsFrozen(option.value === "frozen")}
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-semibold">
                          {option.label}
                        </span>
                        <span className="block text-xs text-base-content/70">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/60">
                  Output State
                </legend>
                {OUTPUT_OPTIONS.map((option) => {
                  const isSelected =
                    option.value === "blackout" ? isBlackout : !isBlackout;

                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                        isSelected
                          ? "border-error/40 bg-error/10"
                          : "border-base-300/70 bg-base-200/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="output-state"
                        className="radio radio-sm radio-error mt-0.5"
                        checked={isSelected}
                        onChange={() =>
                          setIsBlackout(option.value === "blackout")
                        }
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-semibold">
                          {option.label}
                        </span>
                        <span className="block text-xs text-base-content/70">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </div>
            <p className="mt-3 text-xs text-base-content/70">
              Freeze holds the current preview frame. Blackout hides the live
              output.
            </p>
          </div>
        </div>
      </div>

      <div className="app-table-wrap">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>#</th>
              <th>Contestant</th>
              <th>Delegation</th>
              <th>Preview State</th>
            </tr>
          </thead>
          <tbody>
            {contestants.length ? (
              contestants.map((contestant, index) => {
                const isLive = safeActiveIndex === index;
                const isNext = nextIndex === index;

                return (
                  <tr key={contestant.id}>
                    <th>{index + 1}</th>
                    <td>{contestant.fullName}</td>
                    <td>{contestant.delegation}</td>
                    <td>
                      <span
                        className={`badge ${
                          isLive
                            ? isBlackout
                              ? "badge-error"
                              : "badge-success"
                            : isNext
                              ? "badge-info"
                              : "badge-ghost"
                        }`}
                      >
                        {isLive
                          ? isBlackout
                            ? "Hidden"
                            : "Live"
                          : isNext
                            ? "Next"
                            : "Queued"}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="text-base-content/60">
                  No contestants available. Import contestants in Contestants
                  tab first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
