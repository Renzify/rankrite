import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  lockJudgeScore,
  submitJudgeScore,
  unlockJudgeScore,
} from "../../../../../api/eventApi";
import {
  clampJudgeScoreDraftValue,
  parseJudgeScoreValue,
} from "../../../../../shared/lib/judgeScoreConstraints";
import {
  createEmptyScoreEntry,
  formatEnteredValue,
} from "../helpers/scoringTabHelpers";

function areScoreValuesEquivalent(leftValue, rightValue) {
  const leftParsedValue = Number.parseFloat(String(leftValue ?? "").trim());
  const rightParsedValue = Number.parseFloat(String(rightValue ?? "").trim());

  if (Number.isFinite(leftParsedValue) && Number.isFinite(rightParsedValue)) {
    return leftParsedValue === rightParsedValue;
  }

  return String(leftValue ?? "").trim() === String(rightValue ?? "").trim();
}

export function useScoringTabHandlers({
  eventId,
  judges = [],
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
  const [savingJudgeId, setSavingJudgeId] = useState("");
  const [scoreDrafts, setScoreDrafts] = useState({});

  useEffect(() => {
    setScoreDrafts({});
  }, [eventId, eventPhaseId, selectedContestantId]);

  const getJudgeType = (judgeId) =>
    judges.find((judge) => judge.id === judgeId)?.judgeType ?? "";

  const clearJudgeScoreDraft = (judgeId) => {
    setScoreDrafts((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, judgeId)) {
        return prev;
      }

      const next = { ...prev };
      delete next[judgeId];
      return next;
    });
  };

  const getJudgeScoreInputValue = (judgeId) => {
    if (Object.prototype.hasOwnProperty.call(scoreDrafts, judgeId)) {
      return scoreDrafts[judgeId];
    }

    return judgeScores[judgeId]?.value ?? "";
  };

  const isJudgeScoreDirty = (judgeId) => {
    if (!Object.prototype.hasOwnProperty.call(scoreDrafts, judgeId)) {
      return false;
    }

    return !areScoreValuesEquivalent(
      scoreDrafts[judgeId],
      judgeScores[judgeId]?.value ?? "",
    );
  };

  const handleJudgeScoreInputChange = (judgeId, nextValue) => {
    const clampedValue = clampJudgeScoreDraftValue(nextValue, getJudgeType(judgeId));

    setScoreDrafts((prev) => ({
      ...prev,
      [judgeId]: clampedValue,
    }));
  };

  const handleJudgeScoreSave = async (judgeId) => {
    if (!eventId || !selectedContestantId) return;

    const current = judgeScores[judgeId] ?? createEmptyScoreEntry();
    if (current.locked || !isJudgeScoreDirty(judgeId)) return;

    const judgeType = getJudgeType(judgeId);
    const scoreNumber = parseJudgeScoreValue(
      getJudgeScoreInputValue(judgeId),
      judgeType,
    );
    if (scoreNumber === null) return;

    try {
      setSavingJudgeId(judgeId);

      const savedEntry = await submitJudgeScore(eventId, {
        judgeId,
        contestantId: selectedContestantId,
        eventPhaseId,
        score: scoreNumber,
      });

      setJudgeScores((prev) => {
        const previousEntry = prev[judgeId] ?? createEmptyScoreEntry();

        return {
          ...prev,
          [judgeId]: {
            ...previousEntry,
            value: formatEnteredValue(savedEntry?.rawScore ?? scoreNumber),
            locked: Boolean(savedEntry?.locked),
            contestantId: savedEntry?.contestantId ?? selectedContestantId,
            contestantName:
              savedEntry?.contestantName ??
              selectedContestantName ??
              previousEntry.contestantName,
            submittedAt: savedEntry?.submittedAt ?? previousEntry.submittedAt,
          },
        };
      });

      clearJudgeScoreDraft(judgeId);
      setSubmittedScoresError("");
      toast.success(current.value ? "Judge score updated." : "Judge score saved.");
    } catch (error) {
      console.error("Failed to save judge score:", error);
      const message =
        error?.response?.data?.message || "Failed to save judge score.";
      setSubmittedScoresError(message);
      toast.error(message);
    } finally {
      setSavingJudgeId("");
    }
  };

  const handleJudgeScoreInputKeyDown = (event, judgeId) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleJudgeScoreSave(judgeId);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearJudgeScoreDraft(judgeId);
    }
  };

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
    if (savingJudgeId === judgeId || isJudgeScoreDirty(judgeId)) return;

    const current = judgeScores[judgeId] ?? createEmptyScoreEntry();

    if (current.locked) {
      onShowConfirmModal(judgeId, true);
      return;
    }

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
    getJudgeScoreInputValue,
    handleJudgeScoreInputChange,
    handleJudgeScoreInputKeyDown,
    lockingJudgeId,
    savingJudgeId,
    handleJudgeLock,
    handleJudgeScoreSave,
    handleConfirmScoreLock,
    handleConfirmScoreUnlock,
    handleContestantSelect,
    handleContestantRowKeyDown,
    isJudgeScoreDirty,
  };
}