import React from "react";

function JudgeList({
  judges,
  judgeScores,
  handleJudgeLock,
  lockingJudgeId,
  scoringLocked,
  selectedContestantId,
  createEmptyScoreEntry,
}) {
  return (
    <div>
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
  );
}

export default JudgeList;
