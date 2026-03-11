import { useEffect } from "react";
import { useOutletContext } from "react-router";

export default function ScoringTab() {
  const { judges, judgeScores, setJudgeScores, contestants } =
    useOutletContext();

  useEffect(() => {
    setJudgeScores((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const judge of judges) {
        if (!next[judge.id]) {
          next[judge.id] = { value: "", locked: false };
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

  const scoringLocked =
    judges.length > 0 && judges.every((judge) => judgeScores[judge.id]?.locked);

  const handleJudgeLock = (judgeId) => {
    if (scoringLocked) return;

    setJudgeScores((prev) => {
      const current = prev[judgeId] ?? { value: "", locked: false };
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
      <h2 className="text-xl font-semibold tracking-tight">Scoring Monitor</h2>

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
                const scoreEntry = judgeScores[judge.id] ?? {
                  value: "",
                  locked: false,
                };
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
