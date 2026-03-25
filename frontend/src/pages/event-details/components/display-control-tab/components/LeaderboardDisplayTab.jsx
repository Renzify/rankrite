import LivePreview from "./LivePreview";
import EmergencyControls from "./EmergencyControls";
import InfoTooltip from "../../../../../shared/components/InfoTooltip";
import { Activity, Medal, RefreshCcw, Users } from "lucide-react";

const MODE_FEATURES = [
  {
    key: "live-ranking",
    label: "Live Ranking",
    description: "Contestants slide into their new position as scores change.",
    icon: Activity,
  },
  {
    key: "top-three-highlight",
    label: "Top 3 Highlights",
    description: "Podium placements use special indicators for quick audience focus.",
    icon: Medal,
  },
  {
    key: "auto-refresh",
    label: "Auto Refresh",
    description: "Leaderboard updates in real time whenever scoring is updated.",
    icon: RefreshCcw,
  },
];

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

      <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="app-muted-panel flex h-full flex-col">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Leaderboard Mode</h3>
            <InfoTooltip content="Leaderboard Mode: Automatically ranks scored contestants in descending order and updates the live output in real time." />
          </div>

          <p className="mt-2 text-sm text-base-content/70">
            Leaderboard output auto-updates from scored contestants in
            descending order. Contestants without scores are excluded from live
            output until scoring is available.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-success/40 bg-success/10 px-4 py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                <Users className="h-6 w-6 text-success" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-success/90">
                  Scored Contestants
                </p>
                <p className="text-2xl font-bold leading-none">{scoredCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-base-300/80 bg-base-100/80 px-4 py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-200">
                <RefreshCcw className="h-6 w-6 text-base-content/75" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/60">
                  Waiting Score
                </p>
                <p className="text-2xl font-bold leading-none">{unscoredCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            {MODE_FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.key}
                  className="flex min-h-[7.25rem] items-center gap-3 rounded-2xl border border-base-300/70 bg-base-100 px-4 py-3"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-base-200">
                    <Icon className="h-6 w-6 text-base-content/75" aria-hidden />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold leading-tight">{feature.label}</p>
                    <p className="text-xs text-base-content/70">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
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
