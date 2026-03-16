import { useState } from "react";
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

export default function ScoringTab() {
  const { eventDetails, judges, judgeScores, setJudgeScores, contestants } =
    useOutletContext();
  const eventId = eventDetails?.event?.id ?? "";
  const [selectedContestantId, setSelectedContestantId] = useState("");
  const [isLoadingSubmittedScores, setIsLoadingSubmittedScores] = useState(
    Boolean(eventId),
  );
  const [submittedScoresError, setSubmittedScoresError] = useState("");

  const selectedContestant =
    contestants.find((contestant) => contestant.id === selectedContestantId) ??
    null;
  useScoringTabEffects({
    contestants,
    judges,
    selectedContestantId,
    selectedContestantName: selectedContestant?.fullName,
    eventId,
    setSelectedContestantId,
    setJudgeScores,
    setIsLoadingSubmittedScores,
    setSubmittedScoresError,
  });

  const scoringLocked =
    judges.length > 0 && judges.every((judge) => judgeScores[judge.id]?.locked);

  const difficultyScore = useDifficultyScore(judges, judgeScores);
  const artistryScore = useMedianJudgeTypeScore(judges, judgeScores, "artistry");
  const executionScore = useMedianJudgeTypeScore(judges, judgeScores, "execution");
  const totalScore =
    difficultyScore === null || artistryScore === null || executionScore === null
      ? null
      : difficultyScore + artistryScore + executionScore;
  const { penalties } = usePenaltyScore(judges, judgeScores);
  const finalScore =
    totalScore === null || penalties === null ? null : totalScore - penalties;

  const {
    lockingJudgeId,
    handleJudgeLock,
    handleContestantSelect,
    handleContestantRowKeyDown,
  } = useScoringTabHandlers({
    eventId,
    scoringLocked,
    selectedContestantId,
    selectedContestantName: selectedContestant?.fullName,
    judgeScores,
    setJudgeScores,
    setSubmittedScoresError,
    setSelectedContestantId,
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
          judges={judges}
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
    </div>
  );
}
