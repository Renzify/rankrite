const SCORE_FIELDS = ["score", "finalScore", "totalScore"];
const LOCK_STATE_FIELDS = ["isScoreLocked", "scoreLocked", "isLocked", "locked"];

function parseNumericScore(value) {
  const parsedValue = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function resolveContestantScore(contestant) {
  for (const fieldKey of SCORE_FIELDS) {
    const parsedScore = parseNumericScore(contestant?.[fieldKey]);
    if (parsedScore !== null) {
      return parsedScore;
    }
  }

  return null;
}

export function resolveContestantName(contestant) {
  const name = contestant?.fullName ?? contestant?.name ?? "";
  const normalizedName = String(name).trim();
  return normalizedName || "Awaiting contestant";
}

export function resolveContestantDelegation(contestant) {
  const delegation = contestant?.delegation ?? contestant?.teamName ?? "-";
  const normalizedDelegation = String(delegation).trim();
  return normalizedDelegation || "-";
}

export function isContestantScoreLocked(contestant) {
  return LOCK_STATE_FIELDS.some((fieldKey) => contestant?.[fieldKey] === true);
}

export function rankContestantsByScore(contestants = []) {
  const normalizedContestants = contestants.map((contestant, originalIndex) => {
    const scoreValue = resolveContestantScore(contestant);
    const displayName = resolveContestantName(contestant);
    const displayDelegation = resolveContestantDelegation(contestant);
    const isScoreLocked = isContestantScoreLocked(contestant);

    return {
      ...contestant,
      scoreValue,
      displayName,
      displayDelegation,
      isScoreLocked,
      originalIndex,
    };
  });

  const scoredContestants = normalizedContestants
    .filter((contestant) => contestant.isScoreLocked && contestant.scoreValue !== null)
    .sort((leftContestant, rightContestant) => {
      if (rightContestant.scoreValue !== leftContestant.scoreValue) {
        return rightContestant.scoreValue - leftContestant.scoreValue;
      }

      const nameCompareResult = leftContestant.displayName.localeCompare(
        rightContestant.displayName,
        undefined,
        { sensitivity: "base" },
      );

      if (nameCompareResult !== 0) {
        return nameCompareResult;
      }

      return leftContestant.originalIndex - rightContestant.originalIndex;
    });

  const unscoredContestants = normalizedContestants.filter(
    (contestant) => !contestant.isScoreLocked || contestant.scoreValue === null,
  );

  return {
    scoredContestants,
    unscoredContestants,
  };
}

export function buildLeaderboardRows(
  scoredContestants,
  { divisionLevel, apparatus },
) {
  return scoredContestants.map((contestant, index) => ({
    id:
      contestant.id ??
      `contestant-${contestant.originalIndex ?? contestant.displayName}`,
    rank: index + 1,
    name: contestant.displayName,
    delegation: contestant.displayDelegation,
    divisionLevel: divisionLevel || "Division Level",
    apparatus: apparatus || "Current Apparatus",
    score: String(contestant.scoreValue),
    scoreValue: contestant.scoreValue,
  }));
}
