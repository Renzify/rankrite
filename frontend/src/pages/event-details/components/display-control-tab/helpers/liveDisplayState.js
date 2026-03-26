export const DEFAULT_LIVE_DISPLAY_STATE = {
  eventName: "Gymnastics Competition",
  category: "Event Category",
  division: "Event Division",
  divisionLevel: "Division Level",
  apparatus: "Current Apparatus",
  displayLayout: "one-by-one",
  swapMode: "manual",
  leaderboardRows: [],
  hasScoredContestants: false,
  contestant: {
    name: "Awaiting contestant",
    delegation: "-",
    score: "--",
  },
  isBlackout: false,
  isFrozen: false,
  mode: "manual",
};

export function mergeLiveDisplayState(base, incoming) {
  const nextSwapMode =
    incoming?.swapMode ?? incoming?.mode ?? base.swapMode ?? base.mode;
  const inferredHasScoredContestants =
    Array.isArray(incoming?.leaderboardRows) && incoming.leaderboardRows.length > 0;

  return {
    ...base,
    ...incoming,
    displayLayout:
      incoming?.displayLayout === "leaderboard"
        ? "leaderboard"
        : incoming?.displayLayout === "one-by-one"
          ? "one-by-one"
          : base.displayLayout,
    swapMode: nextSwapMode,
    mode: nextSwapMode,
    leaderboardRows: Array.isArray(incoming?.leaderboardRows)
      ? incoming.leaderboardRows
      : base.leaderboardRows,
    hasScoredContestants:
      typeof incoming?.hasScoredContestants === "boolean"
        ? incoming.hasScoredContestants
        : inferredHasScoredContestants,
    contestant: {
      ...base.contestant,
      ...(incoming?.contestant ?? {}),
    },
  };
}
