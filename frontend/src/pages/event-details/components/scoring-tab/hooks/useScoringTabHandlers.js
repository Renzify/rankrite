import { useState } from "react";
import toast from "react-hot-toast";
import { lockJudgeScore, unlockJudgeScore } from "../../../../../api/eventApi";
import {
  createEmptyScoreEntry,
  formatEnteredValue,
} from "../helpers/scoringTabHelpers";

export function useScoringTabHandlers({
  eventId,
  scoringLocked,
  selectedContestantId,
  selectedContestantName,
  eventPhaseId,
  judgeScores,
  setJudgeScores,
  setSubmittedScoresError,
  setSelectedContestantId,
  onShowConfirmModal,
}) {
  const [lockingJudgeId, setLockingJudgeId] = useState("");

  const handleConfirmScoreLock = async (judgeId) => {
    if (scoringLocked || !eventId || !selectedContestantId) return;

    const current = judgeScores[judgeId] ?? createEmptyScoreEntry();
    const scoreNumber = Number.parseFloat(current.value);
    if (!Number.isFinite(scoreNumber) || current.locked) return;

    try {
      setLockingJudgeId(judgeId);

      const lockedEntry = await lockJudgeScore(eventId, {
        judgeId,
        contestantId: selectedContestantId,
        eventPhaseId,
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

  const handleConfirmScoreUnlock = async (judgeId) => {
    if (!eventId || !selectedContestantId) return;

    const current = judgeScores[judgeId] ?? createEmptyScoreEntry();
    if (!current.locked) return;

    try {
      setLockingJudgeId(judgeId);

      const unlockedEntry = await unlockJudgeScore(eventId, {
        judgeId,
        contestantId: selectedContestantId,
        eventPhaseId,
      });

      setJudgeScores((prev) => {
        const previousEntry = prev[judgeId] ?? createEmptyScoreEntry();

        return {
          ...prev,
          [judgeId]: {
            ...previousEntry,
            value: formatEnteredValue(
              unlockedEntry?.rawScore ?? previousEntry.value,
            ),
            locked: false,
            contestantId: unlockedEntry?.contestantId ?? selectedContestantId,
            contestantName:
              unlockedEntry?.contestantName ??
              selectedContestantName ??
              previousEntry.contestantName,
            submittedAt:
              unlockedEntry?.submittedAt ?? previousEntry.submittedAt,
          },
        };
      });

      setSubmittedScoresError("");
      toast.success("Judge submission unlocked.");
    } catch (error) {
      console.error("Failed to unlock judge score:", error);
      const message =
        error?.response?.data?.message || "Failed to unlock judge submission.";
      setSubmittedScoresError(message);
      toast.error(message);
    } finally {
      setLockingJudgeId("");
    }
  };

  const handleJudgeLock = (judgeId) => {
    if (!eventId || !selectedContestantId) return;

    const current = judgeScores[judgeId] ?? createEmptyScoreEntry();

    // If already locked, show unlock confirmation
    if (current.locked) {
      onShowConfirmModal(judgeId, true);
      return;
    }

    // If not locked, show lock confirmation
    const scoreNumber = Number.parseFloat(current.value);
    if (!Number.isFinite(scoreNumber)) return;

    onShowConfirmModal(judgeId, false);
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
    handleConfirmScoreLock,
    handleConfirmScoreUnlock,
    handleContestantSelect,
    handleContestantRowKeyDown,
  };
}
