import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { formatLiveLabel } from "./helpers/liveDisplaySync";
import useDisplayControlEffects from "./hooks/useDisplayControlEffects";
import useDisplayControlHandlers from "./hooks/useDisplayControlHandlers";
import ContestantList from "./components/ContestantList";
import OneByOneDisplayTab from "./components/OneByOneDisplayTab";
import LeaderboardDisplayTab from "./components/LeaderboardDisplayTab";
import InfoTooltip from "../../../../shared/components/InfoTooltip";
import {
  buildLeaderboardRows,
  rankContestantsByScore,
} from "./helpers/contestantRanking";

const DISPLAY_LAYOUTS = [
  {
    value: "one-by-one",
    label: "One-By-One",
  },
  {
    value: "leaderboard",
    label: "Leaderboard",
  },
];

export default function DisplayControlTab() {
  const {
    currentEventPhaseId,
    eventPhases = [],
    eventTitle,
    formValues = {},
    selectedEventType,
    selectedSport,
    eventDetails,
    contestants = [],
    setContestants,
  } = useOutletContext();

  const [displayLayout, setDisplayLayout] = useState("one-by-one");
  const [swapMode, setSwapMode] = useState("manual");
  const [activeIndex, setActiveIndex] = useState(0);
  const [swapSeconds, setSwapSeconds] = useState(5);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);

  const eventId = eventDetails?.event?.id ?? "";

  const { scoredContestants, unscoredContestants } = useMemo(
    () => rankContestantsByScore(contestants),
    [contestants],
  );

  const hasScoredContestants = scoredContestants.length > 0;
  const safeActiveIndex = hasScoredContestants
    ? Math.min(activeIndex, scoredContestants.length - 1)
    : 0;

  const activeContestant = hasScoredContestants
    ? scoredContestants[safeActiveIndex]
    : null;

  const nextIndex = hasScoredContestants
    ? (safeActiveIndex + 1) % scoredContestants.length
    : 0;

  useEffect(() => {
    if (!hasScoredContestants) {
      setActiveIndex(0);
      setIsAutoRunning(false);
      return;
    }

    setActiveIndex((previousIndex) =>
      Math.min(previousIndex, scoredContestants.length - 1),
    );
  }, [hasScoredContestants, scoredContestants.length]);

  const activeContestantName =
    activeContestant?.displayName ?? "Awaiting contestant";
  const activeContestantDelegation = activeContestant?.displayDelegation ?? "-";
  const activeContestantScore = String(
    activeContestant?.scoreValue ?? "--",
  );

  const currentEventPhase = useMemo(
    () =>
      eventPhases.find((phase) => phase.id === currentEventPhaseId) ??
      eventPhases[0] ??
      null,
    [currentEventPhaseId, eventPhases],
  );

  const divisionLevelLabel = formatLiveLabel(
    formValues.competition_level || formValues.division_class,
    "Division Level",
  );
  const currentApparatusLabel =
    currentEventPhase?.optionLabel ||
    currentEventPhase?.label ||
    formatLiveLabel(formValues.apparatus, "Current Apparatus");
  const eventCategoryLabel = formatLiveLabel(
    selectedEventType,
    "Event Category",
  );
  const eventDivisionLabel = formatLiveLabel(
    formValues.division_class || selectedSport,
    "Event Division",
  );

  const leaderboardRows = useMemo(
    () =>
      buildLeaderboardRows(scoredContestants, {
        divisionLevel: divisionLevelLabel,
        apparatus: currentApparatusLabel,
      }),
    [scoredContestants, divisionLevelLabel, currentApparatusLabel],
  );

  const liveDisplayPayload = useMemo(
    () => ({
      eventName: eventTitle || "Event Competition",
      category: eventCategoryLabel,
      division: eventDivisionLabel,
      divisionLevel: divisionLevelLabel,
      apparatus: currentApparatusLabel,
      displayLayout,
      swapMode,
      mode: swapMode,
      hasScoredContestants,
      contestant: {
        name: activeContestantName,
        delegation: activeContestantDelegation,
        score: activeContestantScore,
      },
      leaderboardRows,
      isBlackout,
      isFrozen,
    }),
    [
      activeContestantDelegation,
      activeContestantName,
      activeContestantScore,
      currentApparatusLabel,
      displayLayout,
      divisionLevelLabel,
      eventCategoryLabel,
      eventDivisionLabel,
      eventTitle,
      hasScoredContestants,
      isBlackout,
      isFrozen,
      leaderboardRows,
      swapMode,
    ],
  );

  useDisplayControlEffects({
    eventId,
    liveDisplayPayload,
    setContestants,
    swapMode,
    isAutoRunning,
    isFrozen,
    isBlackout,
    scoredContestantsLength: scoredContestants.length,
    swapSeconds,
    setActiveIndex,
  });

  const {
    handlePrev,
    handleNext,
    handleOpenLiveDisplay,
    handleToggleAutoSwap,
    handleSwapSecondsChange,
    handleSwapModeChange,
    handleFreezeStateChange,
    handleOutputStateChange,
  } = useDisplayControlHandlers({
    hasContestants: hasScoredContestants,
    contestantsLength: scoredContestants.length,
    isFrozen,
    isBlackout,
    setActiveIndex,
    setIsAutoRunning,
    setSwapSeconds,
    setSwapMode,
    setIsFrozen,
    setIsBlackout,
  });

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-xl font-semibold tracking-tight">
            Display Control
          </h2>
          <InfoTooltip content="Display Control: Controls how event information appears on the live public screen. Changes update the live display in real time." />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="badge badge-outline">
            {displayLayout === "one-by-one" ? "One-By-One Mode" : "Leaderboard Mode"}
          </div>
          {displayLayout === "one-by-one" ? (
            <div className="badge badge-outline">
              {swapMode === "manual" ? "Manual Swapping" : "Automatic Swapping"}
            </div>
          ) : null}
          {isFrozen ? <div className="badge badge-warning">Frozen</div> : null}
          {isBlackout ? (
            <div className="badge badge-error">Blackout</div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DISPLAY_LAYOUTS.map((layoutOption) => {
          const isActive = displayLayout === layoutOption.value;

          return (
            <button
              key={layoutOption.value}
              type="button"
              className={`btn btn-sm ${isActive ? "btn-neutral" : "btn-outline"}`}
              onClick={() => setDisplayLayout(layoutOption.value)}
            >
              {layoutOption.label}
            </button>
          );
        })}
      </div>

      {displayLayout === "one-by-one" ? (
        <OneByOneDisplayTab
          liveDisplayPayload={liveDisplayPayload}
          isFrozen={isFrozen}
          handleOpenLiveDisplay={handleOpenLiveDisplay}
          swapMode={swapMode}
          handlePrev={handlePrev}
          hasScoredContestants={hasScoredContestants}
          isBlackout={isBlackout}
          handleNext={handleNext}
          handleToggleAutoSwap={handleToggleAutoSwap}
          handleSwapSecondsChange={handleSwapSecondsChange}
          handleSwapModeChange={handleSwapModeChange}
          isAutoRunning={isAutoRunning}
          swapSeconds={swapSeconds}
          handleFreezeStateChange={handleFreezeStateChange}
          handleOutputStateChange={handleOutputStateChange}
        />
      ) : (
        <LeaderboardDisplayTab
          liveDisplayPayload={liveDisplayPayload}
          isFrozen={isFrozen}
          isBlackout={isBlackout}
          handleOpenLiveDisplay={handleOpenLiveDisplay}
          handleFreezeStateChange={handleFreezeStateChange}
          handleOutputStateChange={handleOutputStateChange}
          scoredCount={scoredContestants.length}
          unscoredCount={unscoredContestants.length}
        />
      )}

      <div className="app-table-wrap">
        <ContestantList
          scoredContestants={scoredContestants}
          unscoredContestants={unscoredContestants}
          safeActiveIndex={safeActiveIndex}
          nextIndex={nextIndex}
          isBlackout={isBlackout}
          displayLayout={displayLayout}
        />
      </div>
    </div>
  );
}
