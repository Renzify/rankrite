import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_LIVE_DISPLAY_STATE,
  mergeLiveDisplayState,
} from "../helpers/liveDisplayState";
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

function WaitingForScores({ isPreview = false }) {
  return (
    <section className="w-full text-center">
      <p
        className={`font-semibold uppercase tracking-[0.16em] text-cyan-200/85 ${
          isPreview ? "text-[10px]" : "text-xs"
        }`}
      >
        Live Display
      </p>
      <h2
        className={`mt-4 font-extrabold tracking-tight text-white ${
          isPreview
            ? "text-[clamp(2rem,6.8vw,4rem)]"
            : "text-[clamp(2rem,8vw,6rem)] md:text-[clamp(3rem,7vw,8rem)]"
        }`}
      >
        Waiting for scored contestants
      </h2>
      <p
        className={`mx-auto mt-4 max-w-2xl text-slate-300 ${
          isPreview ? "text-xs" : "text-sm md:text-xl"
        }`}
      >
        Scores will appear automatically as soon as judges submit and finalize
        results.
      </p>
    </section>
  );
}

function getLeaderboardPlacement(rank) {
  if (rank === 1) {
    return {
      label: "1ST PLACE",
      dotClassName: "bg-amber-300",
      badgeClassName: "border-amber-200/70 text-amber-100 bg-amber-300/15",
      rowClassName: "bg-amber-300/[0.08]",
    };
  }

  if (rank === 2) {
    return {
      label: "2ND PLACE",
      dotClassName: "bg-slate-300",
      badgeClassName: "border-slate-200/60 text-slate-100 bg-slate-300/12",
      rowClassName: "bg-slate-300/[0.06]",
    };
  }

  if (rank === 3) {
    return {
      label: "3RD PLACE",
      dotClassName: "bg-orange-400",
      badgeClassName: "border-orange-300/70 text-orange-100 bg-orange-400/15",
      rowClassName: "bg-orange-300/[0.08]",
    };
  }

  return null;
}

export default function LiveDisplayCanvas({
  liveState,
  isPreview = false,
  fillContainer = false,
}) {
  const displayState = mergeLiveDisplayState(DEFAULT_LIVE_DISPLAY_STATE, liveState);
  const displayLayout =
    displayState.displayLayout === "leaderboard" ? "leaderboard" : "one-by-one";
  const isLeaderboardLayout = displayLayout === "leaderboard";
  const leaderboardRows = useMemo(
    () =>
      Array.isArray(displayState.leaderboardRows)
        ? displayState.leaderboardRows
        : [],
    [displayState.leaderboardRows],
  );
  const leaderboardRowOrderSignature = useMemo(
    () =>
      leaderboardRows
        .map((row, index) => String(row?.id ?? `leaderboard-row-${index}`))
        .join("|"),
    [leaderboardRows],
  );

  const fallbackHasScoredContestant = leaderboardRows.length > 0;
  const hasScoredContestants =
    typeof displayState.hasScoredContestants === "boolean"
      ? displayState.hasScoredContestants
      : fallbackHasScoredContestant;
  const displayScore = formatScoreValue(displayState.contestant.score, "--");
  const leaderboardFrameClassName = isPreview ? "max-w-4xl" : "max-w-[1260px]";
  const leaderboardColumnsClassName = isPreview
    ? "grid-cols-[120px_minmax(180px,1.7fr)_minmax(130px,1.2fr)_minmax(100px,1fr)] gap-x-2 px-3 py-2 text-[9px]"
    : "grid-cols-[220px_minmax(260px,1.85fr)_minmax(220px,1.35fr)_minmax(180px,1.15fr)] gap-x-4 px-5 py-3 text-[10px] md:text-sm";
  const leaderboardRowsClassName = isPreview
    ? "grid-cols-[120px_minmax(180px,1.7fr)_minmax(130px,1.2fr)_minmax(100px,1fr)] gap-x-2 px-3 py-2 text-[10px]"
    : "grid-cols-[220px_minmax(260px,1.85fr)_minmax(220px,1.35fr)_minmax(180px,1.15fr)] gap-x-4 px-5 py-3 text-sm md:text-base";
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

  const leaderboardRowRefs = useRef(new Map());
  const previousRowRectsRef = useRef(new Map());
  const previousLeaderboardOrderSignatureRef = useRef("");
  const seenLeaderboardRowIdsRef = useRef(new Set());
  const [enteringRowIds, setEnteringRowIds] = useState([]);

  const setLeaderboardRowRef = useCallback((rowId, node) => {
    if (node) {
      leaderboardRowRefs.current.set(rowId, node);
      return;
    }

    leaderboardRowRefs.current.delete(rowId);
  }, []);

  useEffect(() => {
    if (displayLayout !== "leaderboard") {
      previousRowRectsRef.current.clear();
      previousLeaderboardOrderSignatureRef.current = "";
      setEnteringRowIds([]);
      return;
    }

    const currentIds = leaderboardRows.map((row, index) =>
      String(row?.id ?? `leaderboard-row-${index}`),
    );
    const unseenIds = currentIds.filter(
      (rowId) => !seenLeaderboardRowIdsRef.current.has(rowId),
    );

    currentIds.forEach((rowId) => seenLeaderboardRowIdsRef.current.add(rowId));

    if (!unseenIds.length) {
      return;
    }

    setEnteringRowIds((previousIds) =>
      Array.from(new Set([...previousIds, ...unseenIds])),
    );

    const timeoutId = window.setTimeout(() => {
      setEnteringRowIds((previousIds) =>
        previousIds.filter((rowId) => !unseenIds.includes(rowId)),
      );
    }, 460);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [displayLayout, leaderboardRows, leaderboardRowOrderSignature]);

  useLayoutEffect(() => {
    if (displayLayout !== "leaderboard") {
      return;
    }

    const currentRowRects = new Map();

    leaderboardRows.forEach((row, index) => {
      const rowId = String(row?.id ?? `leaderboard-row-${index}`);
      const node = leaderboardRowRefs.current.get(rowId);
      if (!node) return;
      currentRowRects.set(rowId, node.getBoundingClientRect());
    });

    const previousOrderSignature = previousLeaderboardOrderSignatureRef.current;
    previousLeaderboardOrderSignatureRef.current = leaderboardRowOrderSignature;

    if (
      previousOrderSignature &&
      previousOrderSignature === leaderboardRowOrderSignature
    ) {
      previousRowRectsRef.current = currentRowRects;
      return;
    }

    leaderboardRows.forEach((row, index) => {
      const rowId = String(row?.id ?? `leaderboard-row-${index}`);
      const node = leaderboardRowRefs.current.get(rowId);
      const previousRect = previousRowRectsRef.current.get(rowId);
      const currentRect = currentRowRects.get(rowId);

      if (!node || !previousRect || !currentRect) {
        return;
      }

      const deltaY = previousRect.top - currentRect.top;
      if (Math.abs(deltaY) < 1) {
        return;
      }

      node.style.transition = "transform 0s";
      node.style.transform = `translate3d(0, ${deltaY}px, 0)`;
      node.style.zIndex = "1";

      requestAnimationFrame(() => {
        node.style.transition =
          "transform 520ms cubic-bezier(0.16, 1, 0.3, 1)";
        node.style.transform = "translate3d(0, 0, 0)";
      });

      const handleTransitionEnd = () => {
        node.style.transition = "";
        node.style.zIndex = "";
      };

      node.addEventListener("transitionend", handleTransitionEnd, {
        once: true,
      });
    });

    previousRowRectsRef.current = currentRowRects;
  }, [displayLayout, leaderboardRows, leaderboardRowOrderSignature]);

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

          {isLeaderboardLayout ? (
            <div
              className={`mt-3 flex flex-wrap items-center justify-center gap-2 ${
                isPreview ? "text-[9px]" : "text-[10px] md:text-xs"
              }`}
            >
              <span className="rounded-full border border-cyan-200/35 bg-cyan-200/10 px-3 py-1 font-semibold uppercase tracking-[0.12em] text-cyan-100">
                Division Level: {displayState.divisionLevel || "Division Level"}
              </span>
              <span className="rounded-full border border-cyan-200/35 bg-cyan-200/10 px-3 py-1 font-semibold uppercase tracking-[0.12em] text-cyan-100">
                Apparatus: {displayState.apparatus || "Current Apparatus"}
              </span>
            </div>
          ) : null}
        </header>

        <main
          className={
            isLeaderboardLayout
              ? `flex-1 ${isPreview ? "pt-2 pb-4 md:pt-3" : "pt-3 pb-8 md:pt-4"}`
              : `flex flex-1 items-center justify-center ${
                  isPreview ? "py-4 md:py-5" : "py-8 md:py-10"
                }`
          }
        >
          {!hasScoredContestants ? (
            <WaitingForScores isPreview={isPreview} />
          ) : isLeaderboardLayout ? (
            <section className="w-full">
              <div
                className={`mx-auto w-full overflow-hidden rounded-[1.15rem] border border-white/15 ${leaderboardFrameClassName}`}
              >
                <div
                  className={`grid border-b border-white/15 bg-slate-900/80 font-semibold uppercase tracking-[0.12em] text-cyan-200/80 ${
                    leaderboardColumnsClassName
                  }`}
                >
                  <span>Rank</span>
                  <span>Contestant</span>
                  <span>Delegation</span>
                  <span>Score</span>
                </div>

                <div>
                  {leaderboardRows.map((row, index) => {
                    const rowId = String(row?.id ?? `leaderboard-row-${index}`);
                    const isEntering = enteringRowIds.includes(rowId);
                    const rowScore = formatScoreValue(
                      row?.scoreValue ?? row?.score,
                      "--",
                    );
                    const placement = getLeaderboardPlacement(row.rank);

                    return (
                      <div
                        key={rowId}
                        ref={(node) => setLeaderboardRowRef(rowId, node)}
                        className={`live-leaderboard-row grid border-b border-white/10 bg-slate-950/70 text-slate-100 transition-colors duration-200 last:border-b-0 ${
                          placement?.rowClassName ?? ""
                        } ${
                          leaderboardRowsClassName
                        } ${isEntering ? "live-leaderboard-row-enter" : ""}`}
                      >
                        <span className="flex items-center gap-2">
                          {placement ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] md:text-[10px] ${placement.badgeClassName}`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${placement.dotClassName}`}
                              />
                              {placement.label}
                            </span>
                          ) : (
                            <span className="font-bold text-cyan-300">
                              #{row.rank}
                            </span>
                          )}
                        </span>
                        <span className="truncate font-semibold text-white">
                          {row.name}
                        </span>
                        <span className="truncate">{row.delegation}</span>
                        <span className="truncate font-bold tabular-nums text-cyan-300">
                          {rowScore}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : (
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
          )}
        </main>
      </div>
    </div>
  );
}
