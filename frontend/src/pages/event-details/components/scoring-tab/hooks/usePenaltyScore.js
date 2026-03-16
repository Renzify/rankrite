import { useMemo } from "react";
import { normalizeJudgeType } from "../helpers/scoringTabHelpers";

function parsePenaltyValue(value) {
  const parsedValue = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function sumJudgeTypePenalty(judges, judgeScores, judgeTypeName) {
  const typeJudges = judges.filter(
    (judge) => normalizeJudgeType(judge.judgeType) === normalizeJudgeType(judgeTypeName),
  );

  if (!typeJudges.length) {
    return 0;
  }

  const parsedValues = typeJudges.map((judge) =>
    parsePenaltyValue(judgeScores[judge.id]?.value),
  );

  if (parsedValues.some((value) => value === null)) {
    return null;
  }

  return parsedValues.reduce((sum, value) => sum + value, 0);
}

export function usePenaltyScore(judges, judgeScores) {
  return useMemo(() => {
    const timePenalty = sumJudgeTypePenalty(judges, judgeScores, "time judge");
    const linePenalty = sumJudgeTypePenalty(judges, judgeScores, "line judge");

    const penalties =
      timePenalty === null || linePenalty === null
        ? null
        : timePenalty + linePenalty;

    return {
      timePenalty,
      linePenalty,
      penalties,
    };
  }, [judges, judgeScores]);
}