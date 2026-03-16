export function createEmptyScoreEntry() {
  return {
    value: "",
    locked: false,
    contestantId: "",
    contestantName: "",
    submittedAt: "",
  };
}

export function formatEnteredValue(value) {
  const parsedValue = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsedValue) ? parsedValue.toFixed(2) : "";
}

export function normalizeJudgeType(judgeType) {
  return String(judgeType ?? "")
    .trim()
    .toLowerCase();
}

function parsePositiveValue(value) {
  const parsedValue = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function computeDifficultyAverage(judgesByType, judgeScores) {
  if (!judgesByType.length) return null;

  const submittedValues = judgesByType.map((judge) =>
    parsePositiveValue(judgeScores[judge.id]?.value),
  );

  if (judgesByType.length === 1) {
    return submittedValues[0];
  }

  if (judgesByType.length === 2) {
    if (submittedValues[0] === null || submittedValues[1] === null) {
      return null;
    }
    return (submittedValues[0] + submittedValues[1]) / 2;
  }

  return null;
}