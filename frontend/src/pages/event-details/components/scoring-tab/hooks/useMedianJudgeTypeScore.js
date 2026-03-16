import { useMemo } from "react";
import { normalizeJudgeType } from "../helpers/scoringTabHelpers";

function parseSubmittedScoreValue(value) {
  const parsedValue = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function getMedian(values) {
  if (!values.length) return null;

  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
  }

  return sortedValues[middleIndex];
}

export function useMedianJudgeTypeScore(judges, judgeScores, judgeTypeName) {
  return useMemo(() => {
    const normalizedJudgeTypeName = normalizeJudgeType(judgeTypeName);

    const scoreJudges = judges.filter(
      (judge) => normalizeJudgeType(judge.judgeType) === normalizedJudgeTypeName,
    );

    if (!scoreJudges.length) {
      return null;
    }

    const submittedScores = scoreJudges
      .map((judge) => parseSubmittedScoreValue(judgeScores[judge.id]?.value))
      .filter((value) => value !== null);

    if (!submittedScores.length) {
      return null;
    }

    const medianScore = getMedian(submittedScores);
    return medianScore;
  }, [judges, judgeScores, judgeTypeName]);
}
