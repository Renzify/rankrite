import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { formatLiveLabel } from "./helpers/liveDisplaySync";
import useDisplayControlEffects from "./hooks/useDisplayControlEffects";
import useDisplayControlHandlers from "./hooks/useDisplayControlHandlers";
import LivePreview from "./components/LivePreview";
import ViewingControls from "./components/ViewingControls";
import ContestantList from "./components/ContestantList";

export default function DisplayControlTab() {
  const {
    eventTitle,
    selectedEventType,
    selectedSport,
    eventDetails,
    contestants,
    setContestants,
  } = useOutletContext();

  const [viewMode, setViewMode] = useState("manual");
  const [activeIndex, setActiveIndex] = useState(0);
  const [swapSeconds, setSwapSeconds] = useState(5);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);

  const eventId = eventDetails?.event?.id ?? "";

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

  useDisplayControlEffects({
    eventId,
    liveDisplayPayload,
    setContestants,
    viewMode,
    isAutoRunning,
    isFrozen,
    isBlackout,
    contestantsLength: contestants.length,
    swapSeconds,
    setActiveIndex,
  });

  const {
    handlePrev,
    handleNext,
    handleOpenLiveDisplay,
    handleToggleAutoSwap,
    handleSwapSecondsChange,
    handleViewModeChange,
    handleFreezeStateChange,
    handleOutputStateChange,
  } = useDisplayControlHandlers({
    hasContestants,
    contestantsLength: contestants.length,
    isFrozen,
    isBlackout,
    setActiveIndex,
    setIsAutoRunning,
    setSwapSeconds,
    setViewMode,
    setIsFrozen,
    setIsBlackout,
  });

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
        <LivePreview
          handleOpenLiveDisplay={handleOpenLiveDisplay}
          isFrozen={isFrozen}
        />
        <ViewingControls
          viewMode={viewMode}
          handlePrev={handlePrev}
          handleNext={handleNext}
          hasContestants={hasContestants}
          isFrozen={isFrozen}
          isBlackout={isBlackout}
          handleToggleAutoSwap={handleToggleAutoSwap}
          handleSwapSecondsChange={handleSwapSecondsChange}
          handleViewModeChange={handleViewModeChange}
          handleFreezeStateChange={handleFreezeStateChange}
          handleOutputStateChange={handleOutputStateChange}
        />
      </div>

      <div className="app-table-wrap">
        <ContestantList contestants={contestants} />
      </div>
    </div>
  );
}
