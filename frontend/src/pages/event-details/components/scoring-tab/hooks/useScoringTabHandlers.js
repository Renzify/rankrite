import { useState } from "react";
import toast from "react-hot-toast";
import { lockJudgeScore } from "../../../../../api/eventApi";
import {
  createEmptyScoreEntry,
  formatEnteredValue,
} from "../helpers/scoringTabHelpers";

export function useScoringTabHandlers({
  eventId,
  scoringLocked,
  selectedContestantId,
  selectedContestantName,
  judgeScores,
  setJudgeScores,
  setSubmittedScoresError,
  setSelectedContestantId,
}) {
  const [lockingJudgeId, setLockingJudgeId] = useState("");

  const handleJudgeLock = async (judgeId) => {
    if (scoringLocked || !eventId || !selectedContestantId) return;

    const current = judgeScores[judgeId] ?? createEmptyScoreEntry();
    const scoreNumber = Number.parseFloat(current.value);
    if (!Number.isFinite(scoreNumber) || current.locked) return;

    try {
      setLockingJudgeId(judgeId);

      const lockedEntry = await lockJudgeScore(eventId, {
        judgeId,
        contestantId: selectedContestantId,
      });

      setJudgeScores((prev) => {
        const previousEntry = prev[judgeId] ?? createEmptyScoreEntry();

        return {
          ...prev,
          [judgeId]: {
            ...previousEntry,
            value: formatEnteredValue(
              lockedEntry?.rawScore ?? previousEntry.value,
            ),
            locked: true,
            contestantId: lockedEntry?.contestantId ?? selectedContestantId,
            contestantName:
              lockedEntry?.contestantName ??
              selectedContestantName ??
              previousEntry.contestantName,
            submittedAt: lockedEntry?.submittedAt ?? previousEntry.submittedAt,
          },
        };
      });

      setSubmittedScoresError("");
      toast.success("Judge submission locked.");
    } catch (error) {
      console.error("Failed to lock judge score:", error);
      const message =
        error?.response?.data?.message || "Failed to lock judge submission.";
      setSubmittedScoresError(message);
      toast.error(message);
    } finally {
      setLockingJudgeId("");
    }
  };

  const handleContestantSelect = (contestantId) => {
    setSelectedContestantId(contestantId);
  };

  const handleContestantRowKeyDown = (event, contestantId) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleContestantSelect(contestantId);
  };

  return {
    lockingJudgeId,
    handleJudgeLock,
    handleContestantSelect,
    handleContestantRowKeyDown,
  };
}