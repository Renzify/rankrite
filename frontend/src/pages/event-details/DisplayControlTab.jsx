import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";

export default function DisplayControlTab() {
  const { eventTitle, selectedSport, contestants } = useOutletContext();

  const [viewMode, setViewMode] = useState("manual");
  const [activeIndex, setActiveIndex] = useState(0);
  const [swapSeconds, setSwapSeconds] = useState(5);
  const [isAutoRunning, setIsAutoRunning] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);

  const hasContestants = contestants.length > 0;
  const safeActiveIndex = hasContestants
    ? Math.min(activeIndex, contestants.length - 1)
    : 0;

  const activeContestant = hasContestants ? contestants[safeActiveIndex] : null;

  const nextIndex = hasContestants
    ? (safeActiveIndex + 1) % contestants.length
    : 0;

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

  const handleFreezeToggle = () => {
    setIsFrozen((prev) => !prev);
  };

  const handleBlackoutToggle = () => {
    setIsBlackout((prev) => !prev);
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Display Control</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="badge badge-outline">
            {viewMode === "manual"
              ? "1 by 1 transition"
              : "live swapping (automatic)"}
          </div>
          {isFrozen ? <div className="badge badge-warning">Frozen</div> : null}
          {isBlackout ? (
            <div className="badge badge-error">Blackout</div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4">
          <div className="app-muted-panel">
            <h3 className="font-semibold">Viewing Mode</h3>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "manual" ? "btn-neutral" : "btn-outline"}`}
                onClick={() => setViewMode("manual")}
              >
                1 by 1 transition
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "auto" ? "btn-neutral" : "btn-outline"}`}
                onClick={() => setViewMode("auto")}
              >
                live swapping
              </button>
            </div>

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
                    className="select select-bordered select-sm"
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
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn btn-sm ${isFrozen ? "btn-warning" : "btn-outline"}`}
                onClick={handleFreezeToggle}
              >
                {isFrozen ? "Unfreeze" : "Freeze"}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${isBlackout ? "btn-error" : "btn-outline"}`}
                onClick={handleBlackoutToggle}
              >
                {isBlackout ? "Disable Blackout" : "Blackout"}
              </button>
            </div>
            <p className="mt-3 text-xs text-base-content/70">
              Freeze holds the current preview frame. Blackout hides the live
              output.
            </p>
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
                      No contestants available. Import contestants in
                      Contestants tab first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="app-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
            Mini Live Preview
          </p>

          <div className="mt-3 overflow-hidden rounded-xl border border-base-300 bg-slate-950 text-base-100">
            <div className="flex items-center justify-between border-b border-white/20 px-4 py-2 text-xs">
              <span>{eventTitle || "Event"}</span>
              <span>{selectedSport || "Sport"}</span>
            </div>

            <div className="aspect-video p-4">
              {isBlackout ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded bg-black">
                  <span className="text-xs uppercase tracking-wide text-white/70">
                    Output Hidden
                  </span>
                  <span className="text-lg font-bold text-red-400">
                    BLACKOUT ACTIVE
                  </span>
                </div>
              ) : activeContestant ? (
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs uppercase tracking-wide text-base-100/70">
                        Now Showing
                      </p>
                      {isFrozen ? (
                        <span className="badge badge-warning badge-xs">
                          Frozen
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-2 text-2xl font-bold leading-tight">
                      {activeContestant.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-base-100/80">
                      {activeContestant.delegation}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded border border-white/20 px-2 py-1">
                      Score: --
                    </div>
                    <div className="rounded border border-white/20 px-2 py-1">
                      Rank: --
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-base-100/70">
                  No preview available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
