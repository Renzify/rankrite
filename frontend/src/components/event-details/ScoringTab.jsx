import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { getEventScoringOverview } from "../../api/eventApi";

function normalizeJudgeType(value) {
  return (value ?? "").trim().toLowerCase();
}

function formatScore(value) {
  return typeof value === "number" ? value.toFixed(2) : "--";
}

function sumValues(values) {
  return values.length
    ? Number(values.reduce((total, value) => total + value, 0).toFixed(2))
    : null;
}

function averageValues(values) {
  return values.length
    ? Number(
        (values.reduce((total, value) => total + value, 0) / values.length).toFixed(2),
      )
    : null;
}

function buildContestantRows(contestants, submissions, judgeCount) {
  return contestants.map((contestant) => {
    const contestantSubmissions = submissions.filter(
      (submission) => submission.contestantId === contestant.id,
    );

    const difficultyValues = [];
    const artistryValues = [];
    const executionValues = [];
    const penaltyValues = [];

    contestantSubmissions.forEach((submission) => {
      const judgeType = normalizeJudgeType(submission.judgeType);

      if (
        judgeType === "difficulty body" ||
        judgeType === "difficulty apparatus"
      ) {
        difficultyValues.push(submission.score);
        return;
      }

      if (judgeType === "artistry") {
        artistryValues.push(submission.score);
        return;
      }

      if (judgeType === "execution") {
        executionValues.push(submission.score);
        return;
      }

      if (judgeType === "line judge" || judgeType === "time judge") {
        penaltyValues.push(submission.penalty ?? submission.score);
      }
    });

    const difficultyScore = sumValues(difficultyValues);
    const artistryScore = averageValues(artistryValues);
    const executionScore = averageValues(executionValues);
    const penalties = sumValues(penaltyValues);
    const totalScore =
      difficultyScore === null && artistryScore === null && executionScore === null
        ? null
        : Number(
            [difficultyScore, artistryScore, executionScore]
              .reduce((total, value) => total + (value ?? 0), 0)
              .toFixed(2),
          );
    const finalScore =
      totalScore === null
        ? null
        : Number((totalScore - (penalties ?? 0)).toFixed(2));

    return {
      contestant,
      difficultyScore,
      artistryScore,
      executionScore,
      penalties,
      totalScore,
      finalScore,
      submissionCount: contestantSubmissions.length,
      status:
        contestantSubmissions.length === 0
          ? "Waiting for scores"
          : judgeCount > 0 && contestantSubmissions.length >= judgeCount
            ? "Ready to confirm"
            : `${contestantSubmissions.length} / ${judgeCount} submitted`,
    };
  });
}

function getSubmissionNote(submission) {
  if (submission.scoreType === "penalty") {
    return "Penalty recorded";
  }

  if (submission.deductions.length) {
    return `${submission.deductions.length} deductions${
      submission.medianDeduction !== null
        ? ` • median ${formatScore(submission.medianDeduction)}`
        : ""
    }`;
  }

  return "Direct score";
}

export default function ScoringTab() {
  const {
    eventDetails,
    judges,
    contestants,
    isScoringLockPending,
    onToggleScoringLock,
  } = useOutletContext();

  const eventId = eventDetails?.event?.id ?? "";
  const isScoringLocked = Boolean(eventDetails?.event?.isScoringLocked);
  const [scoringOverview, setScoringOverview] = useState(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(Boolean(eventId));
  const [isRefreshingScores, setIsRefreshingScores] = useState(false);
  const [overviewError, setOverviewError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadScoringOverview = async () => {
      if (!eventId) {
        setIsOverviewLoading(false);
        setOverviewError("Missing event id.");
        return;
      }

      setIsOverviewLoading(true);
      setOverviewError("");

      try {
        const data = await getEventScoringOverview(eventId);
        if (!isMounted) return;
        setScoringOverview(data);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setOverviewError("Failed to load submitted judge scores.");
      } finally {
        if (isMounted) {
          setIsOverviewLoading(false);
        }
      }
    };

    loadScoringOverview();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const handleRefreshScores = async () => {
    if (!eventId) {
      setOverviewError("Missing event id.");
      return;
    }

    try {
      setIsRefreshingScores(true);
      setOverviewError("");
      const data = await getEventScoringOverview(eventId);
      setScoringOverview(data);
    } catch (error) {
      console.error(error);
      setOverviewError("Failed to refresh submitted judge scores.");
    } finally {
      setIsRefreshingScores(false);
    }
  };

  const submissions = useMemo(
    () => scoringOverview?.submissions ?? [],
    [scoringOverview],
  );
  const contestantRows = useMemo(
    () => buildContestantRows(contestants, submissions, judges.length),
    [contestants, submissions, judges.length],
  );
  const submittedContestantCount = contestantRows.filter(
    (row) => row.submissionCount > 0,
  ).length;

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Scoring Control</h2>
          <p className="mt-1 text-sm text-base-content/70">
            Review judge submissions, then lock scoring once entries are ready for
            confirmation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRefreshScores}
            disabled={isOverviewLoading || isRefreshingScores || !eventId}
          >
            {isRefreshingScores ? "Refreshing..." : "Refresh Scores"}
          </button>

          <button
            type="button"
            className={`btn ${isScoringLocked ? "btn-outline" : "btn-primary"}`}
            onClick={() => onToggleScoringLock(!isScoringLocked)}
            disabled={isScoringLockPending}
          >
            {isScoringLockPending
              ? "Updating..."
              : isScoringLocked
                ? "Unlock Scoring"
                : "Lock Scoring"}
          </button>
        </div>
      </div>

      <div
        className={`alert ${isScoringLocked ? "alert-warning" : "border border-base-300 bg-base-100 text-base-content"}`}
      >
        <span>
          {isScoringLocked
            ? "Scoring is locked. Judges can no longer submit or edit results, and you can continue reviewing submitted entries here."
            : "Scoring is open. You can review submitted entries here before locking scoring."}
        </span>
      </div>

      {overviewError ? (
        <div className="alert alert-error">
          <span>{overviewError}</span>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="app-muted-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
            Event Status
          </p>
          <p className="mt-2 text-lg font-semibold">
            {eventDetails?.event?.status ?? "Draft"}
          </p>
        </div>

        <div className="app-muted-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
            Judges Assigned
          </p>
          <p className="mt-2 text-lg font-semibold">{judges.length}</p>
        </div>

        <div className="app-muted-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
            Contestants Loaded
          </p>
          <p className="mt-2 text-lg font-semibold">{contestants.length}</p>
        </div>

        <div className="app-muted-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
            Contestants With Scores
          </p>
          <p className="mt-2 text-lg font-semibold">{submittedContestantCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
            Computation
          </h3>
          {isOverviewLoading ? (
            <span className="text-sm text-base-content/60">Loading submissions...</span>
          ) : null}
        </div>

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
              {contestantRows.length ? (
                contestantRows.map((row, index) => (
                  <tr key={row.contestant.id}>
                    <th>{index + 1}</th>
                    <td>{row.contestant.fullName}</td>
                    <td>{row.contestant.delegation ?? row.contestant.teamName ?? "-"}</td>
                    <td>{formatScore(row.difficultyScore)}</td>
                    <td>{formatScore(row.artistryScore)}</td>
                    <td>{formatScore(row.executionScore)}</td>
                    <td>{formatScore(row.penalties)}</td>
                    <td>{formatScore(row.totalScore)}</td>
                    <td>{formatScore(row.finalScore)}</td>
                    <td>{row.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-base-content/60">
                    No contestants available. Import contestants in the Contestants tab first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
          Submitted Judge Scores
        </h3>

        <div className="app-table-wrap">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Contestant</th>
                <th>Judge</th>
                <th>Type</th>
                <th>Submitted</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length ? (
                submissions.map((submission) => (
                  <tr
                    key={`${submission.contestantId}_${submission.judgeAssignmentId}_${submission.scoreType}`}
                  >
                    <td>
                      #{submission.contestantEntryNo} {submission.contestantName}
                    </td>
                    <td>
                      {submission.judgeName || "Assigned Judge"}
                      {submission.judgeNumber ? ` (${submission.judgeNumber})` : ""}
                    </td>
                    <td>{submission.judgeType || "Judge"}</td>
                    <td>
                      {submission.scoreType === "penalty"
                        ? formatScore(submission.penalty ?? submission.score)
                        : formatScore(submission.score)}
                    </td>
                    <td>{getSubmissionNote(submission)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-base-content/60">
                    No judge submissions have been recorded yet.
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

