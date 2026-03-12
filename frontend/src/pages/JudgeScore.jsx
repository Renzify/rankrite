import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router";
import { User } from "lucide-react";
import {
  getJudgeScoringContext,
  submitJudgeScore,
} from "../api/eventApi";

const SCORE_RANGE = Array.from({ length: 10 }, (_, index) => index + 1);
const DEFAULT_SCORE_VALUE = "5.00";
const DEFAULT_DEDUCTION_VALUES = ["", "", ""];

function buildFallbackJudge(judgeId, judgeName, judgeType) {
  return {
    id: judgeId || "",
    name: judgeName || "Assigned Judge",
    specialization: judgeType || "Judge",
  };
}

function normalizeContestants(contestants) {
  return [...contestants]
    .sort(
      (left, right) =>
        (left.entryNo ?? Number.MAX_SAFE_INTEGER) -
        (right.entryNo ?? Number.MAX_SAFE_INTEGER),
    )
    .map((contestant, index) => ({
      id: String(contestant.id),
      entryNo: contestant.entryNo ?? index + 1,
      name: contestant.fullName || `Contestant ${index + 1}`,
      delegation: contestant.teamName || "-",
    }));
}

function buildSubmissionsByContestant(submissions) {
  return (submissions ?? []).reduce((accumulator, submission) => {
    accumulator[submission.contestantId] = submission;
    return accumulator;
  }, {});
}

function parseScoreNumber(value) {
  const numericValue = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }
  return numericValue;
}

function getMedian(values) {
  if (!values.length) return null;

  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
  }

  return sortedValues[middleIndex];
}

function formatScore(value) {
  return Number(value).toFixed(2);
}

function getApiErrorMessage(error, fallbackMessage) {
  const responseMessage = error?.response?.data?.message;

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function createEmptyDeductionValues() {
  return [...DEFAULT_DEDUCTION_VALUES];
}

function resetInputState(actions) {
  actions.setScoreValue(DEFAULT_SCORE_VALUE);
  actions.setDecimalValue("");
  actions.setDeductionValues(createEmptyDeductionValues());
  actions.setPenaltyValue("");
}

function applySubmissionInputState(submission, actions, options) {
  resetInputState(actions);

  if (!submission) {
    return;
  }

  if (options.isPenaltyJudge) {
    actions.setPenaltyValue(
      formatScore(submission.penalty ?? submission.score),
    );
    return;
  }

  if (options.isMedianDeductionJudge) {
    actions.setDeductionValues(
      Array.isArray(submission.deductions) && submission.deductions.length
        ? submission.deductions.map((value) => formatScore(value))
        : createEmptyDeductionValues(),
    );
    return;
  }

  const nextScore = formatScore(submission.score);
  actions.setScoreValue(nextScore);
  actions.setDecimalValue(nextScore.split(".")[1] ?? "00");
}

function JudgeScore() {
  const [searchParams] = useSearchParams();

  const eventId = searchParams.get("eventId") ?? "";
  const eventTitleParam =
    searchParams.get("eventTitle") ?? searchParams.get("event") ?? "";
  const sportParam = searchParams.get("sport") ?? "";
  const judgeId = searchParams.get("judgeId") ?? "";
  const judgeNameParam = searchParams.get("judgeName") ?? "";
  const judgeTypeParam = searchParams.get("judgeType") ?? "";

  const fallbackJudge = useMemo(
    () => buildFallbackJudge(judgeId, judgeNameParam, judgeTypeParam),
    [judgeId, judgeNameParam, judgeTypeParam],
  );

  const [selectedContestant, setSelectedContestant] = useState("");
  const [scoreValue, setScoreValue] = useState(DEFAULT_SCORE_VALUE);
  const [decimalValue, setDecimalValue] = useState("");
  const [currentJudge, setCurrentJudge] = useState(fallbackJudge);
  const [contestants, setContestants] = useState([]);
  const [submissionsByContestant, setSubmissionsByContestant] = useState({});
  const [eventTitle, setEventTitle] = useState(
    eventTitleParam || "Judge Scoring",
  );
  const [sportLabel, setSportLabel] = useState(sportParam);
  const [isLoading, setIsLoading] = useState(Boolean(eventId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScoringLocked, setIsScoringLocked] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [deductionValues, setDeductionValues] = useState(
    createEmptyDeductionValues(),
  );
  const [penaltyValue, setPenaltyValue] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAssignedContext = async () => {
      setCurrentJudge(fallbackJudge);
      setContestants([]);
      setSubmissionsByContestant({});
      setSelectedContestant("");
      setEventTitle(eventTitleParam || "Judge Scoring");
      setSportLabel(sportParam);
      setLoadError("");
      setPageNotice("");
      setIsScoringLocked(false);
      setIsEditingSubmission(false);
      resetInputState({
        setScoreValue,
        setDecimalValue,
        setDeductionValues,
        setPenaltyValue,
      });

      if (!eventId) {
        setIsLoading(false);
        setLoadError("This judge access link is missing an event id.");
        return;
      }

      setIsLoading(true);

      try {
        const data = await getJudgeScoringContext(eventId, {
          judgeId: judgeId || undefined,
          judgeName: judgeNameParam || undefined,
        });

        if (!isMounted) return;

        const nextContestants = normalizeContestants(data.contestants ?? []);

        setEventTitle(data.event?.title || eventTitleParam || "Judge Scoring");
        setSportLabel(data.sport || sportParam);
        setContestants(nextContestants);
        setSubmissionsByContestant(
          buildSubmissionsByContestant(data.submissions ?? []),
        );
        setIsScoringLocked(Boolean(data.event?.isScoringLocked));

        if (data.judge) {
          setCurrentJudge({
            id: data.judge.id,
            name: data.judge.fullName || fallbackJudge.name,
            specialization:
              data.judge.judgeType || fallbackJudge.specialization,
          });
        } else {
          setCurrentJudge(fallbackJudge);
          setPageNotice(
            judgeId
              ? "This link did not match a saved judge assignment for the event."
              : "This link is missing a judge assignment.",
          );
        }

        if (!nextContestants.length) {
          setPageNotice(
            (previous) =>
              previous || "No contestants are available for scoring yet.",
          );
        }
      } catch (error) {
        console.error(error);
        if (!isMounted) return;

        setCurrentJudge(fallbackJudge);
        setLoadError("Failed to load the assigned event.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAssignedContext();

    return () => {
      isMounted = false;
    };
  }, [
    eventId,
    eventTitleParam,
    fallbackJudge,
    judgeId,
    judgeNameParam,
    sportParam,
  ]);

  const selectedContestantData =
    contestants.find((contestant) => contestant.id === selectedContestant) ??
    null;
  const selectedSubmission = selectedContestant
    ? submissionsByContestant[selectedContestant] ?? null
    : null;

  const normalizedJudgeType = (currentJudge.specialization ?? "")
    .trim()
    .toLowerCase();
  const isDifficultyJudge =
    normalizedJudgeType === "difficulty body" ||
    normalizedJudgeType === "difficulty apparatus" ||
    normalizedJudgeType === "";
  const isMedianDeductionJudge =
    normalizedJudgeType === "artistry" || normalizedJudgeType === "execution";
  const isPenaltyJudge =
    normalizedJudgeType === "line judge" || normalizedJudgeType === "time judge";

  useEffect(() => {
    const inputActions = {
      setScoreValue,
      setDecimalValue,
      setDeductionValues,
      setPenaltyValue,
    };

    if (!selectedContestant) {
      resetInputState(inputActions);
      setIsEditingSubmission(false);
      return;
    }

    if (selectedSubmission) {
      applySubmissionInputState(selectedSubmission, inputActions, {
        isMedianDeductionJudge,
        isPenaltyJudge,
      });
      setIsEditingSubmission(false);
      return;
    }

    resetInputState(inputActions);
    setIsEditingSubmission(true);
  }, [
    isMedianDeductionJudge,
    isPenaltyJudge,
    selectedContestant,
    selectedSubmission,
  ]);

  const parsedDeductionValues = deductionValues
    .map(parseScoreNumber)
    .filter((value) => value !== null);
  const medianDeduction = parsedDeductionValues.length
    ? getMedian(parsedDeductionValues)
    : null;
  const calculatedMedianScore =
    medianDeduction === null
      ? null
      : Number(Math.max(0, 10 - medianDeduction).toFixed(2));
  const parsedPenaltyValue = parseScoreNumber(penaltyValue);

  const handleDeductionInputChange = (index, nextValue) => {
    setDeductionValues((prev) =>
      prev.map((value, valueIndex) =>
        valueIndex === index ? nextValue : value,
      ),
    );
  };

  const handleAddDeductionInput = () => {
    setDeductionValues((prev) => [...prev, ""]);
  };

  const handleRemoveDeductionInput = (index) => {
    setDeductionValues((prev) =>
      prev.length === 1
        ? prev
        : prev.filter((_, valueIndex) => valueIndex !== index),
    );
  };

  const getWholeNumber = () => {
    const parts = scoreValue.split(".");
    return parseInt(parts[0], 10) || 5;
  };

  const handleDecrease = () => {
    const currentWhole = getWholeNumber();
    if (currentWhole > 1) {
      const newWhole = currentWhole - 1;
      const decimal = decimalValue
        ? decimalValue.padStart(2, "0").slice(0, 2)
        : "00";
      setScoreValue(`${newWhole}.${decimal}`);
      setDecimalValue("");
    }
  };

  const handleIncrease = () => {
    const currentWhole = getWholeNumber();
    if (currentWhole < 10) {
      const newWhole = currentWhole + 1;
      const decimal = decimalValue
        ? decimalValue.padStart(2, "0").slice(0, 2)
        : "00";
      setScoreValue(`${newWhole}.${decimal}`);
      setDecimalValue("");
    }
  };

  const handleScoreClick = (value) => {
    const decimal = decimalValue
      ? decimalValue.padStart(2, "0").slice(0, 2)
      : "00";
    setScoreValue(`${value}.${decimal}`);
    setDecimalValue("");
  };

  const getFinalScore = () => {
    const whole = getWholeNumber();
    const decimal = decimalValue
      ? parseFloat(`0.${decimalValue.padStart(2, "0").slice(0, 2)}`)
      : 0;
    return (whole + decimal).toFixed(2);
  };

  const handleScoreInputChange = (event) => {
    let nextValue = event.target.value.replace(/[^0-9.]/g, "");
    const parts = nextValue.split(".");

    if (parts.length > 2) {
      nextValue = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    if (nextValue.includes(".")) {
      let wholeNum = parseInt(parts[0], 10) || 1;
      if (wholeNum > 10) wholeNum = 10;
      if (wholeNum < 1) wholeNum = 1;
      nextValue = `${wholeNum}.${(parts[1] || "").slice(0, 2)}`;
    } else if (nextValue !== "") {
      let wholeNum = parseInt(nextValue, 10);
      if (wholeNum > 10) wholeNum = 10;
      if (wholeNum < 1) wholeNum = 1;
      nextValue = wholeNum.toString();
    }

    setScoreValue(nextValue);
    setDecimalValue(nextValue.includes(".") ? nextValue.split(".")[1] || "" : "");
  };

  const activeScoreValue = isMedianDeductionJudge
    ? calculatedMedianScore === null
      ? ""
      : formatScore(calculatedMedianScore)
    : isPenaltyJudge
      ? parsedPenaltyValue === null
        ? ""
        : formatScore(parsedPenaltyValue)
      : getFinalScore();

  const canSubmitCurrentEntry = isDifficultyJudge
    ? true
    : isMedianDeductionJudge
      ? medianDeduction !== null
      : isPenaltyJudge
        ? parsedPenaltyValue !== null
        : true;
  const isReadonlySubmission = Boolean(selectedSubmission) && !isEditingSubmission;
  const isInputDisabled =
    isLoading ||
    isSubmitting ||
    Boolean(loadError) ||
    !selectedContestantData ||
    isScoringLocked ||
    isReadonlySubmission;
  const submitButtonDisabled =
    isInputDisabled || !currentJudge.id || !canSubmitCurrentEntry;
  const totalSubmittedCount = Object.keys(submissionsByContestant).length;

  const handleStartEdit = () => {
    if (!selectedSubmission || isScoringLocked) {
      return;
    }

    setIsEditingSubmission(true);
  };

  const handleCancelEdit = () => {
    if (!selectedSubmission) {
      return;
    }

    applySubmissionInputState(
      selectedSubmission,
      {
        setScoreValue,
        setDecimalValue,
        setDeductionValues,
        setPenaltyValue,
      },
      {
        isMedianDeductionJudge,
        isPenaltyJudge,
      },
    );
    setIsEditingSubmission(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedContestantData) {
      toast.error("Select a contestant first.");
      return;
    }

    if (!currentJudge.id) {
      toast.error("This judge link is not tied to a saved assignment.");
      return;
    }

    if (isScoringLocked) {
      toast.error("Scoring is locked for this event.");
      return;
    }

    if (isMedianDeductionJudge && medianDeduction === null) {
      toast.error("Enter at least one deduction.");
      return;
    }

    if (isPenaltyJudge && parsedPenaltyValue === null) {
      toast.error("Enter a deduction or penalty first.");
      return;
    }

    const payload = {
      judgeId: currentJudge.id,
      contestantId: selectedContestantData.id,
      ...(isMedianDeductionJudge
        ? {
            deductions: parsedDeductionValues.map((value) => formatScore(value)),
          }
        : isPenaltyJudge
          ? {
              penalty: formatScore(parsedPenaltyValue),
            }
          : {
              score: activeScoreValue,
            }),
    };

    try {
      setIsSubmitting(true);
      const submission = await submitJudgeScore(eventId, payload);

      if (!submission) {
        toast.error("The event could not be found.");
        return;
      }

      setSubmissionsByContestant((prev) => ({
        ...prev,
        [submission.contestantId]: submission,
      }));
      setIsEditingSubmission(false);
      toast.success(selectedSubmission ? "Result updated." : "Result submitted.");
    } catch (error) {
      if (error?.response?.status === 423) {
        setIsScoringLocked(true);
        setIsEditingSubmission(false);
      }

      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to submit result."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const difficultyScorePanel = (
    <>
      <label className="mb-4 block text-center text-sm font-medium">
        Select Score (1-10):
      </label>

      <div className="mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={handleDecrease}
          className="btn btn-circle btn-lg btn-outline"
          disabled={isInputDisabled}
        >
          -
        </button>

        <div className="relative h-28 overflow-hidden rounded-lg bg-base-200">
          <div className="absolute inset-0 flex items-center justify-center">
            {SCORE_RANGE.map((num) => {
              const isSelected = num === getWholeNumber();
              const distance = Math.abs(num - getWholeNumber());
              const offset = (num - getWholeNumber()) * 60;

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleScoreClick(num)}
                  className="absolute transition-all duration-300 ease-out"
                  disabled={isInputDisabled}
                  style={{
                    left: "50%",
                    marginLeft: `${offset}px`,
                    transform: isSelected
                      ? "translateX(-50%) scale(1.8)"
                      : `translateX(-50%) scale(${Math.max(0.5, 1 - distance * 0.2)})`,
                    opacity: isSelected ? 1 : Math.max(0.15, 1 - distance * 0.3),
                    fontSize: isSelected ? "2.5rem" : "1.25rem",
                    fontWeight: isSelected ? "800" : "400",
                    color: isSelected ? "var(--color-primary)" : "inherit",
                    zIndex: isSelected ? 10 : 1,
                  }}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleIncrease}
          className="btn btn-circle btn-lg btn-outline"
          disabled={isInputDisabled}
        >
          +
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <input
          type="text"
          placeholder={getFinalScore()}
          className="input input-bordered input-lg w-40 text-center text-3xl font-bold"
          value={scoreValue}
          onChange={handleScoreInputChange}
          disabled={isInputDisabled}
        />
        <div className="text-center">
          <span className="text-lg text-base-content/70">Final Score: </span>
          <span className="text-2xl font-bold text-primary">{getFinalScore()}</span>
        </div>
      </div>
    </>
  );

  const scoreInputContent = isDifficultyJudge ? (
    difficultyScorePanel
  ) : isMedianDeductionJudge ? (
    <>
      <label className="mb-4 block text-center text-sm font-medium">
        Enter deductions:
      </label>

      <div className="space-y-3">
        {deductionValues.map((value, index) => (
          <div key={`deduction_${index}`} className="flex items-end gap-2">
            <label className="form-control flex-1">
              <div className="label pb-1">
                <span className="label-text font-semibold">Deduction {index + 1}</span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className="input input-bordered w-full"
                value={value}
                onChange={(event) =>
                  handleDeductionInputChange(index, event.target.value)
                }
                disabled={isInputDisabled}
              />
            </label>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleRemoveDeductionInput(index)}
              disabled={isInputDisabled || deductionValues.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleAddDeductionInput}
          disabled={isInputDisabled}
        >
          Add Deduction
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-base-300 bg-base-200/50 p-4 text-center">
          <p className="text-sm font-medium text-base-content/70">Median Deduction</p>
          <p className="mt-2 text-3xl font-bold">
            {medianDeduction === null ? "--" : formatScore(medianDeduction)}
          </p>
        </div>

        <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-4 text-center">
          <p className="text-sm font-medium text-base-content/70">Calculated Score</p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {calculatedMedianScore === null
              ? "--"
              : formatScore(calculatedMedianScore)}
          </p>
          <p className="mt-1 text-xs text-base-content/60">10 - median deduction</p>
        </div>
      </div>
    </>
  ) : isPenaltyJudge ? (
    <>
      <label className="mb-4 block text-center text-sm font-medium">
        Enter deduction / penalty:
      </label>

      <div className="mx-auto max-w-xs">
        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          className="input input-bordered input-lg w-full text-center text-3xl font-bold"
          value={penaltyValue}
          onChange={(event) => setPenaltyValue(event.target.value)}
          disabled={isInputDisabled}
        />
      </div>

      <div className="mt-4 text-center">
        <span className="text-lg text-base-content/70">Recorded Penalty: </span>
        <span className="text-2xl font-bold text-primary">
          {parsedPenaltyValue === null ? "--" : formatScore(parsedPenaltyValue)}
        </span>
      </div>
    </>
  ) : (
    difficultyScorePanel
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
          <p className="mt-2 text-sm text-base-content/70">
            {eventTitle}
            {sportLabel ? ` • ${sportLabel}` : ""}
          </p>
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

        {isScoringLocked && !loadError ? (
          <div className="alert alert-warning">
            <span>
              Scoring is locked. You can review submitted entries, but you cannot
              add or edit results.
            </span>
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
              <span className="whitespace-nowrap text-sm font-medium">Assigned Judge:</span>
              <hr className="flex-1 border-base-300" />
            </div>
            <div className="flex items-center gap-4 rounded-lg bg-base-200 p-4 ring-2 ring-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-content">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{currentJudge.name}</h3>
                <p className="text-sm text-base-content/70">Judge</p>
                <p className="text-xs text-base-content/60">{currentJudge.specialization}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">Current Contestant</h2>
            <p className="mb-4 text-base-content/70">Representing delegation or team.</p>

            {selectedContestantData ? (
              <div className="mb-4 flex items-center gap-4 rounded-lg bg-base-200 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-content">
                  {selectedContestantData.entryNo}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedContestantData.name}</h3>
                  <p className="text-sm text-base-content/70">{selectedContestantData.delegation}</p>
                  <p className="text-xs text-base-content/60">
                    {selectedSubmission ? "Submitted" : "Waiting for entry"}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mb-4 flex items-center gap-2">
              <hr className="flex-1 border-base-300" />
              <span className="whitespace-nowrap text-sm font-medium">Select Contestant:</span>
              <hr className="flex-1 border-base-300" />
            </div>
            <select
              className="select select-bordered w-full"
              value={selectedContestant}
              onChange={(event) => setSelectedContestant(event.target.value)}
              disabled={isLoading || Boolean(loadError) || !contestants.length}
            >
              <option value="">-- Select a Contestant --</option>
              {contestants.map((contestant) => (
                <option key={contestant.id} value={contestant.id}>
                  Contestant #{contestant.entryNo} - {contestant.name}
                  {submissionsByContestant[contestant.id] ? " • Submitted" : ""}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-lg border border-base-300 bg-base-200/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                Submission Progress
              </p>
              <p className="mt-2 text-lg font-semibold">
                {totalSubmittedCount} of {contestants.length} contestants
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Score Table</h2>
              <p className="mt-2 text-base-content/70">
                Record or update the judge entry for the selected contestant.
              </p>
            </div>

            {selectedSubmission ? (
              <span className="badge badge-outline badge-success px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Submission Saved
              </span>
            ) : null}
          </div>

          <form className="mt-6" onSubmit={handleSubmit}>
            {selectedSubmission ? (
              <div className="mb-6 rounded-lg border border-primary/15 bg-primary/5 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                      Current Submission
                    </p>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      {isPenaltyJudge
                        ? formatScore(selectedSubmission.penalty ?? selectedSubmission.score)
                        : formatScore(selectedSubmission.score)}
                    </p>
                    <p className="mt-1 text-sm text-base-content/70">
                      {isPenaltyJudge ? "Recorded penalty" : "Recorded score"}
                    </p>
                    {isMedianDeductionJudge &&
                    selectedSubmission.medianDeduction !== null ? (
                      <p className="mt-2 text-sm text-base-content/70">
                        Median deduction: {formatScore(selectedSubmission.medianDeduction)}
                      </p>
                    ) : null}
                  </div>

                  {isMedianDeductionJudge && selectedSubmission.deductions.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSubmission.deductions.map((value, index) => (
                        <span key={`saved_deduction_${index}`} className="badge badge-outline">
                          D{index + 1}: {formatScore(value)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

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
                    <p className="text-xs uppercase tracking-wider text-base-content/60">Judge</p>
                    <p className="font-semibold">{currentJudge.name}</p>
                    <p className="text-xs text-base-content/60">{currentJudge.specialization}</p>
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
                      <p className="text-xs uppercase tracking-wider text-base-content/60">Contestant</p>
                      <p className="font-semibold">{selectedContestantData.name}</p>
                      <p className="text-xs text-base-content/60">{selectedContestantData.delegation}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-base-200 bg-base-200 p-4">
                  <div className="flex h-full flex-col items-center justify-center py-4">
                    <p className="text-sm text-base-content/50">Select a contestant</p>
                  </div>
                </div>
              )}
            </div>

            <hr className="mb-6 border-base-300" />

            {selectedContestantData ? (
              <div className="mb-6">{scoreInputContent}</div>
            ) : (
              <div className="mb-6 rounded-lg border border-dashed border-base-300 bg-base-200/40 p-6 text-center text-sm text-base-content/70">
                Select a contestant to start scoring.
              </div>
            )}

            <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
              {selectedSubmission && isEditingSubmission ? (
                <button
                  type="button"
                  className="btn btn-outline w-full max-w-xl text-base sm:w-auto"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              ) : null}

              {isScoringLocked ? (
                <button type="button" className="btn btn-disabled w-full max-w-xl text-lg" disabled>
                  Scoring Locked
                </button>
              ) : selectedSubmission && !isEditingSubmission ? (
                <button
                  type="button"
                  className="btn btn-outline w-full max-w-xl text-lg"
                  onClick={handleStartEdit}
                  disabled={!currentJudge.id || isSubmitting}
                >
                  Edit {isPenaltyJudge ? "Penalty" : "Score"}
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary w-full max-w-xl text-lg"
                  disabled={submitButtonDisabled}
                >
                  {isSubmitting
                    ? "Saving..."
                    : selectedSubmission
                      ? "Update Result"
                      : "Submit Result"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default JudgeScore;
