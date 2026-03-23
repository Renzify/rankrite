import {
  getJudgeScoreInputLimits,
  parseJudgeScoreValue,
} from "../../../../../shared/lib/judgeScoreConstraints";

function JudgeList({
  judges,
  judgeScores,
  getJudgeScoreInputValue,
  handleJudgeLock,
  handleJudgeScoreInputChange,
  handleJudgeScoreInputKeyDown,
  handleJudgeScoreSave,
  isJudgeScoreDirty,
  lockingJudgeId,
  savingJudgeId,
  scoringLocked,
  selectedContestantId,
  createEmptyScoreEntry,
}) {
  return (
    <div>
      <table className="table min-w-[860px]">
        <thead>
          <tr>
            <th>Judge Name</th>
            <th>Judge Type</th>
            <th>Entered Value</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {judges.length ? (
            judges.map((judge, index) => {
              const scoreEntry =
                judgeScores[judge.id] ?? createEmptyScoreEntry();
              const scoreLimits = getJudgeScoreInputLimits(judge.judgeType);
              const inputValue = getJudgeScoreInputValue(judge.id);
              const parsedValue = parseJudgeScoreValue(
                inputValue,
                judge.judgeType,
              );
              const hasValidScore = parsedValue !== null;
              const isDirty = isJudgeScoreDirty(judge.id);
              const isSaving = savingJudgeId === judge.id;
              const isLocking = lockingJudgeId === judge.id;
              const isBusy = isSaving || isLocking;
              const hasSubmittedScore =
                parseJudgeScoreValue(scoreEntry.value, judge.judgeType) !== null;
              const hasTypedValue = String(inputValue ?? "").trim() !== "";
              const status = scoreEntry.locked
                ? "Locked"
                : isDirty
                  ? hasTypedValue
                    ? hasValidScore
                      ? "Unsaved"
                      : "Invalid"
                    : "Pending"
                  : hasSubmittedScore
                    ? "Submitted"
                    : "Pending";
              const canSave = Boolean(
                selectedContestantId &&
                  !scoreEntry.locked &&
                  hasValidScore &&
                  isDirty &&
                  !isBusy,
              );
              const canToggleLock = Boolean(
                selectedContestantId &&
                  !isBusy &&
                  !isDirty &&
                  (scoreEntry.locked || (hasSubmittedScore && !scoringLocked)),
              );
              const inputStateClass = isDirty
                ? hasValidScore
                  ? "input-warning"
                  : "input-error"
                : "";
              const rangeHint =
                scoreLimits.max === null
                  ? `Minimum: ${scoreLimits.min}`
                  : `Allowed range: ${scoreLimits.min} to ${scoreLimits.max}`;

              return (
                <tr key={judge.id}>
                  <td>
                    {index + 1}. {judge.fullName}
                  </td>
                  <td>{judge.judgeType}</td>
                  <td>
                    <input
                      type="number"
                      min={scoreLimits.min}
                      max={scoreLimits.max ?? undefined}
                      step={scoreLimits.step}
                      inputMode="decimal"
                      className={`input input-bordered input-sm w-32 ${inputStateClass}`}
                      value={inputValue}
                      onChange={(event) =>
                        handleJudgeScoreInputChange(judge.id, event.target.value)
                      }
                      onKeyDown={(event) =>
                        handleJudgeScoreInputKeyDown(event, judge.id)
                      }
                      readOnly={scoreEntry.locked}
                      disabled={
                        !selectedContestantId || scoreEntry.locked || isBusy
                      }
                      title={
                        scoreEntry.locked
                          ? "Unlock this submission to edit the score."
                          : `${rangeHint}. Press Enter to save. Press Escape to discard your draft.`
                      }
                    />
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        status === "Locked"
                          ? "badge-success"
                          : status === "Unsaved"
                            ? "badge-warning"
                            : status === "Invalid"
                              ? "badge-error"
                              : status === "Submitted"
                                ? "badge-info"
                                : "badge-ghost"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleJudgeScoreSave(judge.id)}
                        disabled={!canSave}
                      >
                        {isSaving
                          ? "Saving..."
                          : hasSubmittedScore
                            ? "Update"
                            : "Save"}
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          scoreEntry.locked ? "btn-warning" : "btn-neutral"
                        }`}
                        onClick={() => handleJudgeLock(judge.id)}
                        disabled={!canToggleLock}
                      >
                        {isLocking
                          ? scoreEntry.locked
                            ? "Unlocking..."
                            : "Locking..."
                          : scoreEntry.locked
                            ? "Unlock"
                            : "Lock"}
                      </button>
                    </div>
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