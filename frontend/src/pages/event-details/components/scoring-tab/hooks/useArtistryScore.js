import { useMemo } from "react";
import { normalizeJudgeType } from "../helpers/scoringTabHelpers";

function parseNonNegativeValue(value) {
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

export function useArtistryScore(judges, judgeScores) {
  return useMemo(() => {
    const artistryJudges = judges.filter(
      (judge) => normalizeJudgeType(judge.judgeType) === "artistry",
    );

    if (!artistryJudges.length) {
      return null;
    }

    const submittedDeductions = artistryJudges
      .map((judge) => parseNonNegativeValue(judgeScores[judge.id]?.value))
      .filter((value) => value !== null);

    if (!submittedDeductions.length) {
      return null;
    }

    const artistryMedian = getMedian(submittedDeductions);
    return artistryMedian === null ? null : artistryMedian;
  }, [judges, judgeScores]);
}
