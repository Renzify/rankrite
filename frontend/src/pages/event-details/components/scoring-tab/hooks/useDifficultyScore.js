import { useMemo } from "react";
import {
  computeDifficultyAverage,
  normalizeJudgeType,
} from "../helpers/scoringTabHelpers";

export function useDifficultyScore(judges, judgeScores) {
  return useMemo(() => {
    const dbJudges = judges.filter(
      (judge) => normalizeJudgeType(judge.judgeType) === "difficulty body",
    );
    const daJudges = judges.filter(
      (judge) =>
        normalizeJudgeType(judge.judgeType) === "difficulty apparatus",
    );

    const dbAverage = computeDifficultyAverage(dbJudges, judgeScores);
    const daAverage = computeDifficultyAverage(daJudges, judgeScores);

    return dbAverage === null || daAverage === null
      ? null
      : dbAverage + daAverage;
  }, [judges, judgeScores]);
}
