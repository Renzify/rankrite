import { User } from "lucide-react";
import DifficultyScorePanel from "./components/DifficultyScorePanel.jsx";
import PenaltyScorePanel from "./components/PenaltyScorePanel.jsx";
import { useJudgeScoring } from "./hooks/useJudgeScoring.js";

function JudgeScore() {
  const {
    activeScoreValue,
    canSubmitCurrentEntry,
    currentJudge,
    formatScore,
    getFinalScore,
    getWholeNumber,
    handleCancelEdit,
    handleDecrease,
    handleEditSubmission,
    handleIncrease,
    handleScoreClick,
    handleScoreInputChange,
    handleSingleValueChange,
    handleSubmit,
    hasSavedSubmission,
    isDifficultyJudge,
    isEditingSubmission,
    isEntryLocked,
    isLoading,
    isPenaltyJudge,
    isSingleScoreJudge,
    isSubmitting,
    isSubmissionLocked,
    loadError,
    pageNotice,
    parsedSingleValue,
    penaltyValue,
    scoreValue,
    selectedContestant,
    selectedContestantData,
    singleValueInputLimits,
  } = useJudgeScoring();

  const inputPanelDisabled = isEntryLocked || isSubmitting;
  const selectedWholeNumber = getWholeNumber();
  const finalScore = getFinalScore();

  const difficultyPanel = (
    <DifficultyScorePanel
      finalScore={finalScore}
      isDisabled={inputPanelDisabled}
      onDecrease={handleDecrease}
      onIncrease={handleIncrease}
      onScoreInputChange={handleScoreInputChange}
      onScoreSelect={handleScoreClick}
      scoreValue={scoreValue}
      selectedWholeNumber={selectedWholeNumber}
    />
  );

  const singleValuePanel = (
    <PenaltyScorePanel
      formatScore={formatScore}
      inputLabel={
        isPenaltyJudge
          ? "Enter deduction / penalty:"
          : "Enter deduction:"
      }
      isDisabled={inputPanelDisabled}
      maxValue={singleValueInputLimits.max ?? undefined}
      onValueChange={handleSingleValueChange}
      parsedValue={parsedSingleValue}
      value={penaltyValue}
      valueLabel={
        isPenaltyJudge ? "Recorded Penalty:" : "Recorded Deduction:"
      }
    />
  );

  const scoreInputContent = isDifficultyJudge ? (
    difficultyPanel
  ) : isSingleScoreJudge || isPenaltyJudge ? (
    singleValuePanel
  ) : (
    difficultyPanel
  );

  return (
    <div className="min-h-screen bg-base-200 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
            Judge Scoring
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Official Judging Panel
          </h1>
        </div>

        {isLoading ? (
          <div className="alert border border-base-300 bg-base-100 text-base-content">
            <span>Loading assigned event...</span>
          </div>
        ) : null}

        {loadError ? (
          <div className="alert alert-error">
            <span>{loadError}</span>
          </div>
        ) : null}

        {pageNotice && !loadError ? (
          <div className="alert border border-base-300 bg-base-100 text-base-content">
            <span>{pageNotice}</span>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">Authorized Judge</h2>
            <p className="mb-4 text-base-content/70">
              Reserved for accredited judges to record contestant scores.
            </p>
            <div className="mb-4 flex items-center gap-2">
              <hr className="flex-1 border-base-300" />
            </div>
            <div className="flex items-center gap-4 rounded-lg bg-base-200 p-4 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-content">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold"> {currentJudge.name}</h3>
                <p className="text-sm text-base-content/70">
                  {" "}
                  {currentJudge.specialization}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">Current Contestant</h2>
            <p className="mb-4 text-base-content/70">
              Contestant selection is controlled by the admin.
            </p>
            <div className="mb-4 flex items-center gap-2">
              <hr className="flex-1 border-base-300" />
            </div>

            {selectedContestantData ? (
              <div className="mb-4 flex items-center gap-4 rounded-lg bg-base-200 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-content">
                  {selectedContestantData.entryNo}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedContestantData.name}
                  </h3>
                  <p className="text-sm text-base-content/70">
                    {selectedContestantData.delegation}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="mb-6">{scoreInputContent}</div>

          <div className="mt-4 flex justify-center">
            <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
              {isSubmissionLocked ? (
                <button
                  type="button"
                  className="btn btn-primary w-full flex-1 text-lg"
                  disabled
                >
                  Submission Locked
                </button>
              ) : hasSavedSubmission && !isEditingSubmission ? (
                <button
                  type="button"
                  className="btn btn-primary w-full flex-1 text-lg"
                  onClick={handleEditSubmission}
                  disabled={isLoading || Boolean(loadError) || isSubmitting}
                >
                  Edit Submission
                </button>
              ) : (
                <button
                  type="submit"
                  form="scoreForm"
                  className="btn btn-primary w-full flex-1 text-lg"
                  disabled={
                    isLoading ||
                    Boolean(loadError) ||
                    isSubmitting ||
                    !currentJudge.id ||
                    !selectedContestant ||
                    !canSubmitCurrentEntry
                  }
                >
                  {isSubmitting
                    ? "Submitting..."
                    : hasSavedSubmission
                      ? "Save Changes"
                      : "Submit Result"}
                </button>
              )}

              {hasSavedSubmission &&
              isEditingSubmission &&
              !isSubmissionLocked ? (
                <button
                  type="button"
                  className="btn btn-ghost w-full sm:w-auto"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </div>

          <form id="scoreForm" onSubmit={handleSubmit} className="hidden">
            <input type="hidden" name="score" value={activeScoreValue} />
          </form>
        </div>
      </div>
    </div>
  );
}

export default JudgeScore;