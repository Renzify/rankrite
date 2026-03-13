import { User } from "lucide-react";
import DeductionScorePanel from "./components/DeductionScorePanel.jsx";
import DifficultyScorePanel from "./components/DifficultyScorePanel.jsx";
import PenaltyScorePanel from "./components/PenaltyScorePanel.jsx";
import { useJudgeScoring } from "../../hooks/useJudgeScoring.js";

function JudgeScore() {
  const {
    activeScoreValue,
    calculatedMedianScore,
    canSubmitCurrentEntry,
    contestants,
    currentJudge,
    deductionValues,
    formatScore,
    getFinalScore,
    getWholeNumber,
    handleAddDeductionInput,
    handleCancelEdit,
    handleContestantChange,
    handleDecrease,
    handleDeductionInputChange,
    handleEditSubmission,
    handleIncrease,
    handleRemoveDeductionInput,
    handleScoreClick,
    handleScoreInputChange,
    handleSubmit,
    hasSavedSubmission,
    isDifficultyJudge,
    isEditingSubmission,
    isEntryLocked,
    isLoading,
    isMedianDeductionJudge,
    isPenaltyJudge,
    isSubmitting,
    isSubmissionLocked,
    loadError,
    medianDeduction,
    pageNotice,
    parsedPenaltyValue,
    penaltyValue,
    scoreValue,
    selectedContestant,
    selectedContestantData,
    setPenaltyValue,
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

  const scoreInputContent = isDifficultyJudge ? (
    difficultyPanel
  ) : isMedianDeductionJudge ? (
    <DeductionScorePanel
      calculatedMedianScore={calculatedMedianScore}
      deductionValues={deductionValues}
      formatScore={formatScore}
      isDisabled={inputPanelDisabled}
      medianDeduction={medianDeduction}
      onAddDeductionInput={handleAddDeductionInput}
      onDeductionInputChange={handleDeductionInputChange}
      onRemoveDeductionInput={handleRemoveDeductionInput}
    />
  ) : isPenaltyJudge ? (
    <PenaltyScorePanel
      formatScore={formatScore}
      isDisabled={inputPanelDisabled}
      onPenaltyChange={setPenaltyValue}
      parsedPenaltyValue={parsedPenaltyValue}
      penaltyValue={penaltyValue}
    />
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
              <span className="text-sm font-medium whitespace-nowrap">
                Assigned Judge:
              </span>
              <hr className="flex-1 border-base-300" />
            </div>
            <div className="flex items-center gap-4 rounded-lg bg-base-200 p-4 transition-colors ring-2 ring-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-content">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{currentJudge.name}</h3>
                <p className="text-sm text-base-content/70">Judge</p>
                <p className="text-xs text-base-content/60">
                  {currentJudge.specialization}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">Current Contestant</h2>
            <p className="mb-4 text-base-content/70">
              Representing delegation or team.
            </p>

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

            <div className="mb-4 flex items-center gap-2">
              <hr className="flex-1 border-base-300" />
              <span className="text-sm font-medium whitespace-nowrap">
                Select Contestant:
              </span>
              <hr className="flex-1 border-base-300" />
            </div>
            <select
              className="select select-bordered w-full"
              value={selectedContestant}
              onChange={handleContestantChange}
              disabled={
                isLoading ||
                Boolean(loadError) ||
                !contestants.length ||
                isSubmitting
              }
            >
              <option value="">-- Select a Contestant --</option>
              {contestants.map((contestant) => (
                <option key={contestant.id} value={contestant.id}>
                  Contestant #{contestant.entryNo} - {contestant.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Score Table</h2>
          <p className="mb-4 text-base-content/70">
            Record the judge entry for the current contestant.
          </p>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-content">
                  {currentJudge.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part.charAt(0))
                    .join("")
                    .toUpperCase() || "J"}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-base-content/60">
                    Judge
                  </p>
                  <p className="font-semibold">{currentJudge.name}</p>
                  <p className="text-xs text-base-content/60">
                    {currentJudge.specialization}
                  </p>
                </div>
              </div>
            </div>

            {selectedContestantData ? (
              <div className="rounded-lg border border-secondary/20 bg-gradient-to-r from-secondary/10 to-secondary/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-bold text-secondary-content">
                    {selectedContestantData.entryNo}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-base-content/60">
                      Contestant
                    </p>
                    <p className="font-semibold">
                      {selectedContestantData.name}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {selectedContestantData.delegation}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-base-200 bg-base-200 p-4">
                <div className="flex h-full flex-col items-center justify-center py-4">
                  <p className="text-sm text-base-content/50">
                    Select a Contestant
                  </p>
                </div>
              </div>
            )}
          </div>

          <hr className="mb-6 border-base-300" />

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
