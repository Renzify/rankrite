import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router";
import { getEventJudgeScores, lockJudgeScore } from "../../api/eventApi";

function createEmptyScoreEntry() {
  return {
    value: "",
    locked: false,
    contestantId: "",
    contestantName: "",
    submittedAt: "",
  };
}

function formatEnteredValue(value) {
  const parsedValue = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsedValue) ? parsedValue.toFixed(2) : "";
}

export default function ScoringTab() {
  const { eventDetails, judges, judgeScores, setJudgeScores, contestants } =
    useOutletContext();
  const eventId = eventDetails?.event?.id ?? "";
  const [selectedContestantId, setSelectedContestantId] = useState("");
  const [isLoadingSubmittedScores, setIsLoadingSubmittedScores] = useState(
    Boolean(eventId),
  );
  const [submittedScoresError, setSubmittedScoresError] = useState("");
  const [lockingJudgeId, setLockingJudgeId] = useState("");

  const selectedContestant =
    contestants.find((contestant) => contestant.id === selectedContestantId) ??
    null;

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
  }, [contestants]);

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
              latestEntry?.contestantName ?? selectedContestant?.fullName ?? "";
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

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [
    eventId,
    judges,
    selectedContestant?.fullName,
    selectedContestantId,
    setJudgeScores,
  ]);

  const scoringLocked =
    judges.length > 0 && judges.every((judge) => judgeScores[judge.id]?.locked);

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
              selectedContestant?.fullName ??
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

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Scoring Monitor
          </h2>
          <div
            className="tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200"
            data-tip="Scoring Tab: Monitor live score submissions and scoring progress during the event. It also handles score confirmation and result computation."
          >
            ?
          </div>
        </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Scoring Monitor
        </h2>
        <p className="text-sm text-base-content/70">
          Click a contestant in the computation table to view that entry&apos;s
          judge submissions.
        </p>
        {selectedContestant ? (
          <p className="text-sm font-medium text-base-content/80">
            Viewing Contestant #{selectedContestant.entryNo}:{" "}
            {selectedContestant.fullName}
          </p>
        ) : null}
        {isLoadingSubmittedScores ? (
          <p className="text-sm text-base-content/60">
            Loading submitted judge scores...
          </p>
        ) : null}
      </div>

      {submittedScoresError ? (
        <div className="alert alert-error">
          <span>{submittedScoresError}</span>
        </div>
      ) : null}

      {scoringLocked ? (
        <div className="alert alert-success">
          <span>Scoring is locked for the selected contestant.</span>
        </div>
      ) : null}

      <div className="app-table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Judge Name</th>
              <th>Judge Type</th>
              <th>Entered Value</th>
              <th>Status</th>
              <th>Confirm</th>
            </tr>
          </thead>
          <tbody>
            {judges.length ? (
              judges.map((judge, index) => {
                const scoreEntry =
                  judgeScores[judge.id] ?? createEmptyScoreEntry();
                const parsedValue = Number.parseFloat(scoreEntry.value);
                const hasValidScore = Number.isFinite(parsedValue);
                const status = scoreEntry.locked
                  ? "Locked"
                  : hasValidScore
                    ? "Submitted"
                    : "Pending";

                return (
                  <tr key={judge.id}>
                    <td>
                      {" "}
                      {index + 1 + "."} {judge.fullName}
                    </td>
                    <td> {judge.judgeType}</td>
                    <td>
                      <input
                        type="number"
                        step="0.001"
                        className="input input-bordered input-sm w-32"
                        value={scoreEntry.value}
                        readOnly
                        disabled
                      />
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          status === "Locked"
                            ? "badge-success"
                            : status === "Submitted"
                              ? "badge-info"
                              : "badge-ghost"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-neutral"
                        onClick={() => handleJudgeLock(judge.id)}
                        disabled={
                          !selectedContestantId ||
                          !hasValidScore ||
                          scoreEntry.locked ||
                          scoringLocked ||
                          lockingJudgeId === judge.id
                        }
                      >
                        {lockingJudgeId === judge.id
                          ? "Confirming..."
                          : "Confirm"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="text-base-content/60">
                  No judges available. Add judges in the Judges tab first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
          Computation
        </h3>

        <div className="app-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Contestant</th>
                <th>Delegation</th>
                <th>D</th>
                <th>A</th>
                <th>E</th>
                <th>Penalties</th>
                <th>Total</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {contestants.length ? (
                contestants.map((contestant, index) => {
                  const isSelected = contestant.id === selectedContestantId;

                  return (
                    <tr
                      key={contestant.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleContestantSelect(contestant.id)}
                      onKeyDown={(event) =>
                        handleContestantRowKeyDown(event, contestant.id)
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-base-200/90 outline outline-1 outline-base-300"
                          : "hover:bg-base-200/60"
                      }`}
                    >
                      <td className="font-medium">
                        {" "}
                        {index + 1 + ". "}
                        {contestant.fullName}
                      </td>
                      <td>{contestant.delegation}</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="text-base-content/60">
                    No contestants available. Import contestants in the
                    Contestants tab first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
