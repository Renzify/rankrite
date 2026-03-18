import { useEffect } from "react";
import { getEventJudgeScores } from "../../../../../api/eventApi";
import {
  getSocket,
  SOCKET_EVENT_JUDGE_SCORE_UPDATED,
  subscribeToEventRoom,
  unsubscribeFromEventRoom,
} from "../../../../../shared/lib/socket";
import {
  createEmptyScoreEntry,
  formatEnteredValue,
} from "../helpers/scoringTabHelpers";

export function useScoringTabEffects({
  contestants,
  judges,
  selectedContestantId,
  selectedContestantName,
  eventId,
  eventPhaseId,
  setSelectedContestantId,
  setJudgeScores,
  setIsLoadingSubmittedScores,
  setSubmittedScoresError,
}) {
  useEffect(() => {
    if (!contestants.length) {
      setSelectedContestantId("");
      return;
    }

    setSelectedContestantId((currentId) => {
      if (contestants.some((contestant) => contestant.id === currentId)) {
        return currentId;
      }

      return contestants[0].id;
    });
  }, [contestants, setSelectedContestantId]);

  useEffect(() => {
    setJudgeScores((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const judge of judges) {
        if (!next[judge.id]) {
          next[judge.id] = createEmptyScoreEntry();
          changed = true;
        }
      }

      for (const judgeId of Object.keys(next)) {
        if (!judges.some((judge) => judge.id === judgeId)) {
          delete next[judgeId];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [judges, setJudgeScores]);

  useEffect(() => {
    setJudgeScores((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const judge of judges) {
        const current = next[judge.id] ?? createEmptyScoreEntry();
        const clearedEntry = {
          ...current,
          value: "",
          locked: false,
          contestantId: "",
          contestantName: "",
          submittedAt: "",
        };

        if (
          current.value !== clearedEntry.value ||
          current.locked !== clearedEntry.locked ||
          current.contestantId !== clearedEntry.contestantId ||
          current.contestantName !== clearedEntry.contestantName ||
          current.submittedAt !== clearedEntry.submittedAt
        ) {
          next[judge.id] = clearedEntry;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [selectedContestantId, judges, setJudgeScores]);

  useEffect(() => {
    if (!eventId) {
      setIsLoadingSubmittedScores(false);
      setSubmittedScoresError("");
      return undefined;
    }

    if (!selectedContestantId) {
      setIsLoadingSubmittedScores(false);
      setSubmittedScoresError("");
      return undefined;
    }

    let isMounted = true;

    const syncSubmittedScores = async (
      { showLoading } = { showLoading: false },
    ) => {
      if (showLoading) {
        setIsLoadingSubmittedScores(true);
      }

      try {
        const submittedScores = await getEventJudgeScores(eventId, {
          contestantId: selectedContestantId,
          eventPhaseId,
        });
        if (!isMounted) return;

        const latestScoreByJudgeId = new Map(
          submittedScores.map((entry) => [entry.judgeId, entry]),
        );

        setJudgeScores((prev) => {
          const next = { ...prev };
          let changed = false;

          for (const judge of judges) {
            const current = next[judge.id] ?? createEmptyScoreEntry();
            const latestEntry = latestScoreByJudgeId.get(judge.id);
            const nextValue = formatEnteredValue(latestEntry?.rawScore ?? "");
            const nextContestantId =
              latestEntry?.contestantId ?? selectedContestantId;
            const nextContestantName =
              latestEntry?.contestantName ?? selectedContestantName ?? "";
            const nextSubmittedAt = latestEntry?.submittedAt ?? "";
            const nextLocked = Boolean(latestEntry?.locked);

            if (
              current.value !== nextValue ||
              current.locked !== nextLocked ||
              current.contestantId !== nextContestantId ||
              current.contestantName !== nextContestantName ||
              current.submittedAt !== nextSubmittedAt
            ) {
              next[judge.id] = {
                ...current,
                value: nextValue,
                locked: nextLocked,
                contestantId: nextContestantId,
                contestantName: nextContestantName,
                submittedAt: nextSubmittedAt,
              };
              changed = true;
            }
          }

          return changed ? next : prev;
        });

        setSubmittedScoresError("");
      } catch (error) {
        console.error("Failed to refresh judge scores:", error);
        if (!isMounted) return;
        setSubmittedScoresError(
          "Failed to refresh submitted judge scores for the selected contestant.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingSubmittedScores(false);
        }
      }
    };

    syncSubmittedScores({ showLoading: true });

    const pollId = window.setInterval(() => {
      syncSubmittedScores();
    }, 3000);

    const handleWindowFocus = () => {
      syncSubmittedScores();
    };

    const socket = getSocket();
    const handleRealtimeScoreUpdate = (payload) => {
      if (payload?.eventId && payload.eventId !== eventId) return;

      const payloadContestantId = payload?.contestantId
        ? String(payload.contestantId)
        : "";

      if (payloadContestantId && payloadContestantId !== selectedContestantId) {
        return;
      }

      syncSubmittedScores();
    };

    subscribeToEventRoom(eventId);
    window.addEventListener("focus", handleWindowFocus);
    socket.on(SOCKET_EVENT_JUDGE_SCORE_UPDATED, handleRealtimeScoreUpdate);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
      window.removeEventListener("focus", handleWindowFocus);
      socket.off(SOCKET_EVENT_JUDGE_SCORE_UPDATED, handleRealtimeScoreUpdate);
      unsubscribeFromEventRoom(eventId);
    };
  }, [
    eventId,
    eventPhaseId,
    judges,
    selectedContestantName,
    selectedContestantId,
    setIsLoadingSubmittedScores,
    setJudgeScores,
    setSubmittedScoresError,
  ]);
}
