import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import {
  LIVE_DISPLAY_CHANNEL_NAME,
  LIVE_DISPLAY_MESSAGE_TYPE,
  formatLiveLabel,
  writeLiveDisplayState,
} from "../../lib/liveDisplaySync";

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
  const [isAutoRunning, setIsAutoRunning] = useState(false);
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
      eventName: eventTitle || "Event Competition",
      category: formatLiveLabel(selectedEventType, "Event Category"),
      division: formatLiveLabel(selectedSport, "Event Division"),
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight m-0">
            Display Control
          </h2>
          <div
            className="tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200"
            data-tip="Display Control: Controls how event information appears on the live public screen. Changes update the live display in real time."
          >
            ?
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-2">
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
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Viewing Mode</h3>
              <div
                className="tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200"
                data-tip="Viewing Mode: Controls how contestants are shown on the live display. It lets you choose between manual navigation or automatic rotation."
              >
                ?
              </div>
            </div>

            <fieldset className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {VIEW_MODE_OPTIONS.map((option) => {
                const isSelected = viewMode === option.value;

                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border pt-4 pl-3 pr-10 transition-all duration-200 ${
                      isSelected
                        ? "border-base-content/30 bg-base-100"
                        : "border-base-300/70 bg-base-200/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="view-mode"
                      className="radio radio-lg self-start mt-2"
                      checked={isSelected}
                      onChange={() => setViewMode(option.value)}
                    />
                    <div className="flex flex-col items-center w-full text-center gap-1">
                      <div className="w-12 h-12 bg-base-200 rounded-xl flex items-center justify-center my-4">
                        {option.value === "manual" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="block text-lg font-bold">
                        {option.label}
                      </span>
                      <span className="block text-sm text-base-content/70 max-w-xs mb-5">
                        {option.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </fieldset>

            {viewMode === "manual" ? (
              <div className="mt-10 flex flex-wrap gap-2 h-48 items-start">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline flex items-center gap-2"
                    onClick={handlePrev}
                    disabled={!hasContestants || isFrozen || isBlackout}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous Contestant
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline flex items-center gap-2"
                    onClick={handleNext}
                    disabled={!hasContestants || isFrozen || isBlackout}
                  >
                    Next Contestant
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3 h-48 flex flex-col items-start">
                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text">Auto swap interval:</span>
                  </div>
                  <select
                    className="select select-bordered w-full select-sm"
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

                <div className="pt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline flex items-center gap-2 w-full"
                    onClick={() => setIsAutoRunning((prev) => !prev)}
                    disabled={!hasContestants || isFrozen || isBlackout}
                  >
                    {isAutoRunning ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-7 h-7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 9v6m4-6v6"
                          />
                        </svg>
                        Pause Auto Swap
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-7 h-7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                        </svg>
                        Resume Auto Swap
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="app-muted-panel">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Emergency Controls</h3>
              <div
                className="tooltip tooltip-error tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-error bg-transparent text-error flex items-center justify-center text-sm font-medium cursor-help hover:bg-error hover:text-error-content transition-all duration-200"
                data-tip="Emergency Controls: Manage urgent display actions during interruptions or issues. Changes apply immediately to the live display."
              >
                ?
              </div>
            </div>
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
