function normalizeJudgeType(judgeType) {
  return String(judgeType ?? "")
    .trim()
    .toLowerCase();
}

export function getJudgeScoreInputLimits(judgeType) {
  const normalizedJudgeType = normalizeJudgeType(judgeType);

  if (
    normalizedJudgeType === "artistry" ||
    normalizedJudgeType === "execution"
  ) {
    return {
      min: 0,
      max: 10,
      step: 0.01,
    };
  }

  if (
    normalizedJudgeType === "line judge" ||
    normalizedJudgeType === "time judge"
  ) {
    return {
      min: 0,
      max: null,
      step: 0.01,
    };
  }

  return {
    min: 1,
    max: 10,
    step: 0.01,
  };
}

export function parseJudgeScoreValue(value, judgeType) {
  const normalizedValue = String(value ?? "").trim();

  if (normalizedValue === "") {
    return null;
  }

  const parsedValue = Number.parseFloat(normalizedValue);
  const { min, max } = getJudgeScoreInputLimits(judgeType);

  if (!Number.isFinite(parsedValue) || parsedValue < min) {
    return null;
  }

  if (max !== null && parsedValue > max) {
    return null;
  }

  return parsedValue;
}

export function clampJudgeScoreDraftValue(value, judgeType) {
  const nextValue = String(value ?? "");

  if (nextValue.trim() === "") {
    return "";
  }

  const parsedValue = Number.parseFloat(nextValue);
  const { max } = getJudgeScoreInputLimits(judgeType);

  if (Number.isFinite(parsedValue) && max !== null && parsedValue > max) {
    return String(max);
  }

  return nextValue;
}