import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router";

function formatScore(value) {
  return Number.isFinite(value) ? value.toFixed(3) : "-";
}

export default function ScoringTab() {
  const {
    eventTitle,
    selectedSport,
    formValues,
    selectableFields,
    getFilteredOptions,
    judges,
    judgeScores,
    setJudgeScores,
  } = useOutletContext();

  const apparatusField = useMemo(
    () =>
      selectableFields.find((field) => field.key === "apparatus") ??
      selectableFields.find((field) =>
        /apparatus/i.test(`${field.key} ${field.label}`),
      ),
    [selectableFields],
  );

  const apparatusOptions = apparatusField
    ? getFilteredOptions(apparatusField)
    : [];
  const apparatusValue = apparatusField
    ? formValues[apparatusField.key] || ""
    : "";
  const apparatusLabel =
    apparatusOptions.find((option) => option.value === apparatusValue)?.label ||
    apparatusValue;

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

  const submittedScores = judges
    .map((judge) => Number.parseFloat(judgeScores[judge.id]?.value))
    .filter((score, index) => {
      const judge = judges[index];
      return Number.isFinite(score) && judgeScores[judge.id]?.locked;
    });

  const submittedCount = submittedScores.length;
  const totalScore = submittedScores.reduce((sum, score) => sum + score, 0);
  const averageScore = submittedCount ? totalScore / submittedCount : null;
  const highestScore = submittedCount ? Math.max(...submittedScores) : null;
  const lowestScore = submittedCount ? Math.min(...submittedScores) : null;

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
      <h2 className="text-lg font-semibold">Scoring Monitor</h2>

      {scoringLocked ? (
        <div className="alert alert-success">
          <span>Scoring is locked.</span>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
            <p className="text-xs uppercase text-base-content/60">Submitted</p>
            <p className="text-xl font-semibold">{submittedCount}</p>
          </div>

          <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
            <p className="text-xs uppercase text-base-content/60">Average</p>
            <p className="text-xl font-semibold">{formatScore(averageScore)}</p>
          </div>

          <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
            <p className="text-xs uppercase text-base-content/60">Highest</p>
            <p className="text-xl font-semibold">{formatScore(highestScore)}</p>
          </div>

          <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
            <p className="text-xs uppercase text-base-content/60">Lowest</p>
            <p className="text-xl font-semibold">{formatScore(lowestScore)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
