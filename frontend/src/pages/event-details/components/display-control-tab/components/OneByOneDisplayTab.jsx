import LivePreview from "./LivePreview";
import ViewingControls from "./ViewingControls";
import EmergencyControls from "./EmergencyControls";

function OneByOneDisplayTab({
  liveDisplayPayload,
  isFrozen,
  handleOpenLiveDisplay,
  swapMode,
  handlePrev,
  hasScoredContestants,
  isBlackout,
  handleNext,
  handleToggleAutoSwap,
  handleSwapSecondsChange,
  handleSwapModeChange,
  isAutoRunning,
  swapSeconds,
  handleFreezeStateChange,
  handleOutputStateChange,
}) {
  return (
    <div className="space-y-4">
      <LivePreview
        handleOpenLiveDisplay={handleOpenLiveDisplay}
        isFrozen={isFrozen}
        liveDisplayPayload={liveDisplayPayload}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1fr]">
        <ViewingControls
          swapMode={swapMode}
          handlePrev={handlePrev}
          hasContestants={hasScoredContestants}
          isFrozen={isFrozen}
          isBlackout={isBlackout}
          handleNext={handleNext}
          handleToggleAutoSwap={handleToggleAutoSwap}
          handleSwapSecondsChange={handleSwapSecondsChange}
          handleSwapModeChange={handleSwapModeChange}
          isAutoRunning={isAutoRunning}
          swapSeconds={swapSeconds}
        />

        <EmergencyControls
          isFrozen={isFrozen}
          isBlackout={isBlackout}
          handleFreezeStateChange={handleFreezeStateChange}
          handleOutputStateChange={handleOutputStateChange}
        />
      </div>
    </div>
  );
}

export default OneByOneDisplayTab;
