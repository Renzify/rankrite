export const DEFAULT_LIVE_DISPLAY_STATE = {
  eventName: "Gymnastics Competition",
  category: "Event Category",
  division: "Event Division",
  divisionLevel: "Division Level",
  apparatus: "Current Apparatus",
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
  return {
    ...base,
    ...incoming,
    contestant: {
      ...base.contestant,
      ...(incoming?.contestant ?? {}),
    },
  };
}