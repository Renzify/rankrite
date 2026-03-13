import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { getEventJudgeScores } from "../../api/eventApi";

function createEmptyScoreEntry(locked = false) {
  return {
    value: "",
    locked,
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
  const [isLoadingSubmittedScores, setIsLoadingSubmittedScores] = useState(
    Boolean(eventId),
  );
  const [submittedScoresError, setSubmittedScoresError] = useState("");

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
    if (!eventId) {
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
        const submittedScores = await getEventJudgeScores(eventId);
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
            const nextContestantId = latestEntry?.contestantId ?? "";
            const nextContestantName = latestEntry?.contestantName ?? "";
            const nextSubmittedAt = latestEntry?.submittedAt ?? "";

            if (
              current.value !== nextValue ||
              current.contestantId !== nextContestantId ||
              current.contestantName !== nextContestantName ||
              current.submittedAt !== nextSubmittedAt
            ) {
              next[judge.id] = {
                ...current,
                value: nextValue,
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
        setSubmittedScoresError("Failed to refresh submitted judge scores.");
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
  }, [eventId, judges, setJudgeScores]);

  const scoringLocked =
    judges.length > 0 && judges.every((judge) => judgeScores[judge.id]?.locked);

  const handleJudgeLock = (judgeId) => {
    if (scoringLocked) return;

    setJudgeScores((prev) => {
      const current = prev[judgeId] ?? createEmptyScoreEntry();
      const scoreNumber = Number.parseFloat(current.value);
      if (!Number.isFinite(scoreNumber) || current.locked) return prev;

      return {
        ...prev,
        [judgeId]: {
          ...current,
          locked: true,
        },
      };
    });
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
          <span>Scoring is locked.</span>
        </div>
      ) : null}

      <div className="app-table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Judge Name</th>
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
                const status = scoreEntry.locked ? "Locked" : "Pending";

                return (
                  <tr key={judge.id}>
                    <th>{index + 1}</th>
                    <td>{judge.fullName}</td>
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
                          status === "Locked" ? "badge-success" : "badge-ghost"
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
                          !hasValidScore || scoreEntry.locked || scoringLocked
                        }
                      >
                        Confirm
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
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>#</th>
                <th>Contestant</th>
                <th>Delegation</th>
                <th>D</th>
                <th>A</th>
                <th>E</th>
                <th>Penalties</th>
                <th>Total</th>
                <th>Final</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contestants.length ? (
                contestants.map((contestant, index) => (
                  <tr key={contestant.id}>
                    <th>{index + 1}</th>
                    <td>{contestant.fullName}</td>
                    <td>{contestant.delegation}</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>Pending integration</td>
                  </tr>
                ))
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
