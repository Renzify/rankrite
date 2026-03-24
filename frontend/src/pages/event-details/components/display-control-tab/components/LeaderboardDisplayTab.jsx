import LivePreview from "./LivePreview";
import EmergencyControls from "./EmergencyControls";

function LeaderboardDisplayTab({
  liveDisplayPayload,
  isFrozen,
  isBlackout,
  handleOpenLiveDisplay,
  handleFreezeStateChange,
  handleOutputStateChange,
  scoredCount,
  unscoredCount,
}) {
  return (
    <div className="space-y-4">
      <LivePreview
        handleOpenLiveDisplay={handleOpenLiveDisplay}
        isFrozen={isFrozen}
        liveDisplayPayload={liveDisplayPayload}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="app-muted-panel">
          <h3 className="font-semibold">Leaderboard Mode</h3>
          <p className="mt-2 text-sm text-base-content/70">
            Leaderboard output auto-updates from scored contestants in
            descending order. Contestants without scores are excluded from live
            output until scoring is available.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="badge badge-success badge-outline">
              {scoredCount} scored
            </span>
            <span className="badge badge-ghost">{unscoredCount} no score</span>
            {isBlackout ? <span className="badge badge-error">Blackout</span> : null}
            {isFrozen ? <span className="badge badge-warning">Frozen</span> : null}
          </div>
        </div>

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

export default LeaderboardDisplayTab;
