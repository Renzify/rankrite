import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import {
  createEmptyScoreEntry,
  formatEnteredValue,
} from "./helpers/scoringTabHelpers";
import { useDifficultyScore } from "./hooks/useDifficultyScore";
import { useMedianJudgeTypeScore } from "./hooks/useMedianJudgeTypeScore";
import { useScoringTabEffects } from "./hooks/useScoringTabEffects";
import { usePenaltyScore } from "./hooks/usePenaltyScore";
import { useScoringTabHandlers } from "./hooks/useScoringTabHandlers";
import JudgeList from "./components/JudgeList";
import ComputationTable from "./components/ComputationTable";
import ConfirmScoreModal from "./components/ConfirmScoreModal";

export default function ScoringTab() {
  const {
    eventDetails,
    judges,
    judgeScores,
    setJudgeScores,
    contestants,
    eventPhases,
    currentEventPhaseId,
  } = useOutletContext();
  const eventId = eventDetails?.event?.id ?? "";
  const scopedJudges = useMemo(
    () =>
      judges.filter((judge) =>
        currentEventPhaseId
          ? !judge.eventPhaseId || judge.eventPhaseId === currentEventPhaseId
          : !judge.eventPhaseId,
      ),
    [currentEventPhaseId, judges],
  );
  const currentApparatusLabel = useMemo(
    () =>
      eventPhases?.find((phase) => phase.id === currentEventPhaseId)?.label ??
      "",
    [currentEventPhaseId, eventPhases],
  );
  const [selectedContestantId, setSelectedContestantId] = useState("");
  const [isLoadingSubmittedScores, setIsLoadingSubmittedScores] = useState(
    Boolean(eventId),
  );
  const [submittedScoresError, setSubmittedScoresError] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedJudgeIdForConfirm, setSelectedJudgeIdForConfirm] =
    useState("");
  const [isUnlockMode, setIsUnlockMode] = useState(false);

  const selectedContestant =
    contestants.find((contestant) => contestant.id === selectedContestantId) ??
    null;

  const handleShowConfirmModal = (judgeId, shouldUnlock = false) => {
    setSelectedJudgeIdForConfirm(judgeId);
    setIsUnlockMode(shouldUnlock);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedJudgeIdForConfirm("");
    setIsUnlockMode(false);
  };

  useScoringTabEffects({
    contestants,
    judges: scopedJudges,
    selectedContestantId,
    selectedContestantName: selectedContestant?.fullName,
    eventId,
    eventPhaseId: currentEventPhaseId,
    setSelectedContestantId,
    setJudgeScores,
    setIsLoadingSubmittedScores,
    setSubmittedScoresError,
  });

  const scoringLocked =
    scopedJudges.length > 0 &&
    scopedJudges.every((judge) => judgeScores[judge.id]?.locked);

  const difficultyScore = useDifficultyScore(scopedJudges, judgeScores);
  const artistryScore = useMedianJudgeTypeScore(
    scopedJudges,
    judgeScores,
    "artistry",
  );
  const executionScore = useMedianJudgeTypeScore(
    scopedJudges,
    judgeScores,
    "execution",
  );
  const totalScore =
    difficultyScore === null ||
    artistryScore === null ||
    executionScore === null
      ? null
      : difficultyScore + artistryScore + executionScore;
  const { penalties } = usePenaltyScore(scopedJudges, judgeScores);
  const finalScore =
    totalScore === null || penalties === null ? null : totalScore - penalties;

  const {
    lockingJudgeId,
    handleJudgeLock,
    handleConfirmScoreLock,
    handleConfirmScoreUnlock,
    handleContestantSelect,
    handleContestantRowKeyDown,
  } = useScoringTabHandlers({
    eventId,
    scoringLocked,
    selectedContestantId,
    selectedContestantName: selectedContestant?.fullName,
    eventPhaseId: currentEventPhaseId,
    judgeScores,
    setJudgeScores,
    setSubmittedScoresError,
    setSelectedContestantId,
    onShowConfirmModal: handleShowConfirmModal,
  });

  return (
    <div className="w-full space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Scoring Monitor
          </h2>
          <div
            className="tooltip tooltip-warning tooltip-bottom z-[100] flex h-[25px] w-[25px] cursor-help items-center justify-center rounded-full border-2 border-warning bg-transparent text-sm font-medium text-warning transition-all duration-200 hover:bg-warning hover:text-warning-content"
            data-tip="Scoring Tab: Monitor live score submissions and scoring progress during the event. It also handles score confirmation and result computation."
          >
            ?
          </div>
        </div>
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
        {currentApparatusLabel ? (
          <p className="text-sm text-base-content/70">
            Current Apparatus:{" "}
            <span className="font-semibold text-base-content/90">
              {currentApparatusLabel}
            </span>
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
        <JudgeList
          judges={scopedJudges}
          judgeScores={judgeScores}
          handleJudgeLock={handleJudgeLock}
          lockingJudgeId={lockingJudgeId}
          scoringLocked={scoringLocked}
          selectedContestantId={selectedContestantId}
          createEmptyScoreEntry={createEmptyScoreEntry}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
          Computation
        </h3>

        <div className="app-table-wrap">
          <ComputationTable
            contestants={contestants}
            selectedContestantId={selectedContestantId}
            handleContestantSelect={handleContestantSelect}
            handleContestantRowKeyDown={handleContestantRowKeyDown}
            difficultyScore={difficultyScore}
            artistryScore={artistryScore}
            executionScore={executionScore}
            penalties={penalties}
            totalScore={totalScore}
            finalScore={finalScore}
            formatEnteredValue={formatEnteredValue}
          />
        </div>
      </div>

      <ConfirmScoreModal
        isOpen={isConfirmModalOpen}
        isUnlock={isUnlockMode}
        onClose={handleCloseConfirmModal}
        onConfirm={() => {
          if (isUnlockMode) {
            handleConfirmScoreUnlock(selectedJudgeIdForConfirm);
          } else {
            handleConfirmScoreLock(selectedJudgeIdForConfirm);
          }
          handleCloseConfirmModal();
        }}
        judgeName={
          scopedJudges.find((j) => j.id === selectedJudgeIdForConfirm)
            ?.fullName ?? ""
        }
        score={judgeScores[selectedJudgeIdForConfirm]?.value ?? ""}
        scoreValue={
          judgeScores[selectedJudgeIdForConfirm]?.value
            ? Number.parseFloat(judgeScores[selectedJudgeIdForConfirm].value)
            : null
        }
        isConfirming={lockingJudgeId === selectedJudgeIdForConfirm}
      />
    </div>
  );
}
