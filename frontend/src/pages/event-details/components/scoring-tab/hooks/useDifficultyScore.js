import { useMemo } from "react";
import {
  computeDifficultyAverage,
  normalizeJudgeType,
} from "../helpers/scoringTabHelpers";

function parseSubmittedDifficultyScore(value) {
  const parsedValue = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function computeDisplayedDifficultyAverage(judgesByType, judgeScores) {
  if (!judgesByType.length) {
    return undefined;
  }

  const submittedScores = judgesByType
    .map((judge) => parseSubmittedDifficultyScore(judgeScores[judge.id]?.value))
    .filter((value) => value !== null);

  if (!submittedScores.length) {
    return null;
  }

  return submittedScores.reduce((total, score) => total + score, 0) / submittedScores.length;
}

function sumSubmittedDifficultyScores(difficultyScores) {
  const submittedScores = difficultyScores.filter((score) => typeof score === "number");

  return submittedScores.length
    ? submittedScores.reduce((total, score) => total + score, 0)
    : null;
}

function sumComputedDifficultyScores(difficultyScores) {
  const configuredScores = difficultyScores.filter(
    (score) => score !== undefined,
  );

  if (!configuredScores.length) {
    return null;
  }

  if (configuredScores.some((score) => score === null)) {
    return null;
  }

  return configuredScores.reduce((total, score) => total + score, 0);
}

export function useDifficultyScore(judges, judgeScores) {
  return useMemo(() => {
    const dbJudges = judges.filter(
      (judge) => normalizeJudgeType(judge.judgeType) === "difficulty body",
    );
    const daJudges = judges.filter(
      (judge) =>
        normalizeJudgeType(judge.judgeType) === "difficulty apparatus",
    );

    const dbDisplayedAverage = computeDisplayedDifficultyAverage(
      dbJudges,
      judgeScores,
    );
    const daDisplayedAverage = computeDisplayedDifficultyAverage(
      daJudges,
      judgeScores,
    );

    const dbComputedAverage = dbJudges.length
      ? computeDifficultyAverage(dbJudges, judgeScores)
      : undefined;
    const daComputedAverage = daJudges.length
      ? computeDifficultyAverage(daJudges, judgeScores)
      : undefined;

    return {
      displayScore: sumSubmittedDifficultyScores([
        dbDisplayedAverage,
        daDisplayedAverage,
      ]),
      computedScore: sumComputedDifficultyScores([
        dbComputedAverage,
        daComputedAverage,
      ]),
    };
  }, [judges, judgeScores]);
}
