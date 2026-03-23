import { DEFAULT_LIVE_DISPLAY_STATE, mergeLiveDisplayState } from "../helpers/liveDisplayState";
import { formatScoreValue } from "../../../../../shared/lib/scoreFormatting";

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
          isPreview ? "text-sm md:text-base" : "text-xl sm:text-2xl md:text-3xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function LiveDisplayCanvas({
  liveState,
  isPreview = false,
  fillContainer = false,
}) {
  const displayState = mergeLiveDisplayState(DEFAULT_LIVE_DISPLAY_STATE, liveState);
  const displayScore = formatScoreValue(displayState.contestant.score, "--");
  const viewportClassName = fillContainer
    ? "h-full overflow-hidden"
    : "min-h-screen";
  const layoutClassName = fillContainer
    ? "h-full px-4 py-3 md:px-5 md:py-4"
    : isPreview
      ? "min-h-screen px-4 py-3 md:px-5 md:py-4"
      : "min-h-screen px-5 py-6 md:px-8 md:py-8 lg:px-10";

  const eventMeta = [displayState.category, displayState.division].filter(
    (value) => value && value !== "Event Category" && value !== "Event Division",
  );

  if (displayState.isBlackout) {
    return (
      <div
        className={`flex items-center justify-center bg-black text-white ${viewportClassName}`}
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
    <div className={`bg-slate-950 text-slate-100 ${viewportClassName}`}>
      <div
        className={`mx-auto flex w-full max-w-[1800px] flex-col ${layoutClassName}`}
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
            {displayState.eventName}
          </h1>
          {eventMeta.length ? (
            <p
              className={`mt-2 font-medium uppercase tracking-[0.16em] text-cyan-200/70 ${
                isPreview ? "text-[9px]" : "text-[11px] md:text-xs"
              }`}
            >
              {eventMeta.join(" / ")}
            </p>
          ) : null}
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
                  : "text-[clamp(2.2rem,10vw,6rem)] md:text-[clamp(4rem,8vw,12rem)]"
              }`}
            >
              {displayState.contestant.name}
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
                  value={displayState.contestant.delegation}
                  isPreview={isPreview}
                />
                <InfoItem
                  label="Division Level"
                  value={displayState.divisionLevel || "Division Level"}
                  isPreview={isPreview}
                />
                <InfoItem
                  label="Apparatus"
                  value={displayState.apparatus || "Current Apparatus"}
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
                  : "text-[clamp(2.4rem,11vw,6rem)] md:text-[clamp(3.75rem,10vw,10rem)]"
              }`}
            >
              {displayScore}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
