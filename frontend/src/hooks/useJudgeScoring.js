import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router";
import {
  getEventDetails,
  getEventJudgeScores,
  submitJudgeScore,
} from "../api/eventApi";

const DEFAULT_SCORE_VALUE = "5.00";

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
  return value.toFixed(2);
}

function buildSubmissionsByContestantId(judgeScores, judgeId) {
  return Object.fromEntries(
    judgeScores
      .filter(
        (entry) =>
          entry.rawScore !== null &&
          entry.contestantId &&
          entry.judgeId === judgeId,
      )
      .map((entry) => [
        entry.contestantId,
        {
          contestantId: entry.contestantId,
          contestantName: entry.contestantName || "Saved contestant",
          rawScore: Number(entry.rawScore),
          locked: Boolean(entry.locked),
        },
      ]),
  );
}

function hasSameSubmissionEntry(leftEntry, rightEntry) {
  if (!leftEntry || !rightEntry) {
    return leftEntry === rightEntry;
  }

  return (
    leftEntry.contestantId === rightEntry.contestantId &&
    leftEntry.contestantName === rightEntry.contestantName &&
    leftEntry.rawScore === rightEntry.rawScore &&
    Boolean(leftEntry.locked) === Boolean(rightEntry.locked)
  );
}

function mergeSubmissionMaps(currentMap, nextMap) {
  const currentKeys = Object.keys(currentMap);
  const nextKeys = Object.keys(nextMap);

  if (!currentKeys.length && !nextKeys.length) {
    return currentMap;
  }

  let changed = currentKeys.length !== nextKeys.length;
  const mergedMap = {};

  for (const contestantId of nextKeys) {
    const currentEntry = currentMap[contestantId];
    const nextEntry = nextMap[contestantId];

    if (hasSameSubmissionEntry(currentEntry, nextEntry)) {
      mergedMap[contestantId] = currentEntry;
      continue;
    }

    mergedMap[contestantId] = nextEntry;
    changed = true;
  }

  return changed ? mergedMap : currentMap;
}

function resetScoreInputs({
  setScoreValue,
  setDecimalValue,
  setDeductionValues,
  setPenaltyValue,
}) {
  setScoreValue(DEFAULT_SCORE_VALUE);
  setDecimalValue("");
  setDeductionValues(["", "", ""]);
  setPenaltyValue("");
}

function applyStoredScoreToInputs(rawScore, judgeType, actions) {
  const formattedScore = formatScore(rawScore);
  const normalizedJudgeType = (judgeType ?? "").trim().toLowerCase();

  if (
    normalizedJudgeType === "line judge" ||
    normalizedJudgeType === "time judge"
  ) {
    actions.setPenaltyValue(formattedScore);
    return;
  }

  if (
    normalizedJudgeType === "artistry" ||
    normalizedJudgeType === "execution"
  ) {
    actions.setDeductionValues([formatScore(Math.max(0, 10 - rawScore))]);
    return;
  }

  actions.setScoreValue(formattedScore);
  actions.setDecimalValue(formattedScore.split(".")[1] || "");
}

export function useJudgeScoring() {
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
  const [_eventTitle, setEventTitle] = useState(
    eventTitleParam || "Judge Scoring",
  );
  const [_sportLabel, setSportLabel] = useState(sportParam);
  const [isLoading, setIsLoading] = useState(Boolean(eventId));
  const [loadError, setLoadError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [deductionValues, setDeductionValues] = useState(["", "", ""]);
  const [penaltyValue, setPenaltyValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionsByContestantId, setSubmissionsByContestantId] = useState(
    {},
  );
  const [submittedEntry, setSubmittedEntry] = useState(null);
  const [isEditingSubmission, setIsEditingSubmission] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAssignedContext = async () => {
      setCurrentJudge(fallbackJudge);
      setContestants([]);
      setSelectedContestant("");
      setSubmissionsByContestantId({});
      setSubmittedEntry(null);
      setIsEditingSubmission(true);
      resetScoreInputs({
        setScoreValue,
        setDecimalValue,
        setDeductionValues,
        setPenaltyValue,
      });
      setEventTitle(eventTitleParam || "Judge Scoring");
      setSportLabel(sportParam);
      setLoadError("");
      setPageNotice("");

      if (!eventId) {
        setIsLoading(false);
        setLoadError("This judge access link is missing an event id.");
        return;
      }

      setIsLoading(true);

      try {
        const data = await getEventDetails(eventId);
        if (!isMounted) return;

        const matchedJudge =
          data.judges.find((judge) => judge.id === judgeId) ??
          data.judges.find((judge) => judge.fullName === judgeNameParam) ??
          null;
        const nextContestants = normalizeContestants(data.contestants ?? []);

        setEventTitle(data.event?.title || eventTitleParam || "Judge Scoring");
        setSportLabel(data.formValues?.sport || sportParam);
        setContestants(nextContestants);

        if (matchedJudge) {
          const nextJudge = {
            id: matchedJudge.id,
            name: matchedJudge.fullName || fallbackJudge.name,
            specialization:
              matchedJudge.judgeType || fallbackJudge.specialization,
          };

          setCurrentJudge(nextJudge);

          const judgeScores = await getEventJudgeScores(eventId, {
            judgeId: nextJudge.id,
          });
          if (!isMounted) return;

          const nextSubmissionsByContestantId = buildSubmissionsByContestantId(
            judgeScores,
            nextJudge.id,
          );

          setSubmissionsByContestantId(nextSubmissionsByContestantId);

          const nextDefaultContestant =
            nextContestants.find(
              (contestant) => !nextSubmissionsByContestantId[contestant.id],
            ) ??
            nextContestants[0] ??
            null;

          if (nextDefaultContestant) {
            setSelectedContestant(nextDefaultContestant.id);
          }
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

  useEffect(() => {
    if (isLoading || loadError || !eventId || !currentJudge.id) {
      return undefined;
    }

    let isMounted = true;

    const syncLockedSubmissions = async () => {
      try {
        const judgeScores = await getEventJudgeScores(eventId, {
          judgeId: currentJudge.id,
        });
        if (!isMounted) return;

        const nextSubmissionMap = buildSubmissionsByContestantId(
          judgeScores,
          currentJudge.id,
        );

        setSubmissionsByContestantId((prev) =>
          mergeSubmissionMaps(prev, nextSubmissionMap),
        );
      } catch (error) {
        console.error("Failed to refresh judge submissions:", error);
      }
    };

    syncLockedSubmissions();

    const pollId = window.setInterval(() => {
      syncLockedSubmissions();
    }, 3000);

    const handleWindowFocus = () => {
      syncLockedSubmissions();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [currentJudge.id, eventId, isLoading, loadError]);

  const syncContestantSubmissionState = (
    contestantId,
    submissionMap = submissionsByContestantId,
  ) => {
    if (!contestantId) {
      setSubmittedEntry(null);
      setIsEditingSubmission(true);
      resetScoreInputs({
        setScoreValue,
        setDecimalValue,
        setDeductionValues,
        setPenaltyValue,
      });
      return;
    }

    const nextSubmittedEntry = submissionMap[contestantId] ?? null;

    setSubmittedEntry(nextSubmittedEntry);

    if (!nextSubmittedEntry) {
      setIsEditingSubmission(true);
      resetScoreInputs({
        setScoreValue,
        setDecimalValue,
        setDeductionValues,
        setPenaltyValue,
      });
      return;
    }

    applyStoredScoreToInputs(
      nextSubmittedEntry.rawScore,
      currentJudge.specialization,
      {
        setScoreValue,
        setDecimalValue,
        setDeductionValues,
        setPenaltyValue,
      },
    );
    setIsEditingSubmission(false);
  };

  const selectedContestantSubmission = selectedContestant
    ? (submissionsByContestantId[selectedContestant] ?? null)
    : null;

  useEffect(() => {
    if (!selectedContestant) {
      setSubmittedEntry(null);
      setIsEditingSubmission(true);
      resetScoreInputs({
        setScoreValue,
        setDecimalValue,
        setDeductionValues,
        setPenaltyValue,
      });
      return;
    }

    const nextSubmittedEntry = selectedContestantSubmission;

    setSubmittedEntry(nextSubmittedEntry);

    if (!nextSubmittedEntry) {
      setIsEditingSubmission(true);
      resetScoreInputs({
        setScoreValue,
        setDecimalValue,
        setDeductionValues,
        setPenaltyValue,
      });
      return;
    }

    applyStoredScoreToInputs(
      nextSubmittedEntry.rawScore,
      currentJudge.specialization,
      {
        setScoreValue,
        setDecimalValue,
        setDeductionValues,
        setPenaltyValue,
      },
    );
    setIsEditingSubmission(false);
  }, [
    selectedContestant,
    selectedContestantSubmission,
    currentJudge.specialization,
  ]);

  const selectedContestantData =
    contestants.find((contestant) => contestant.id === selectedContestant) ??
    null;

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
    normalizedJudgeType === "line judge" ||
    normalizedJudgeType === "time judge";

  const parsedDeductionValues = deductionValues
    .map(parseScoreNumber)
    .filter((value) => value !== null);
  const medianDeduction = parsedDeductionValues.length
    ? getMedian(parsedDeductionValues)
    : null;
  const calculatedMedianScore =
    medianDeduction === null ? null : Math.max(0, 10 - medianDeduction);
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
    return parseInt(parts[0]) || 5;
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

  const handleScoreInputChange = (e) => {
    let val = e.target.value;
    val = val.replace(/[^0-9.]/g, "");
    const parts = val.split(".");

    if (parts.length > 2) {
      val = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    if (val.includes(".")) {
      const wholePart = parts[0];
      let wholeNum = parseInt(wholePart) || 1;
      if (wholeNum > 10) wholeNum = 10;
      if (wholeNum < 1) wholeNum = 1;

      const decimalPart = parts[1] || "";
      val = `${wholeNum}.${decimalPart.slice(0, 2)}`;
    } else if (val !== "") {
      let wholeNum = parseInt(val);
      if (wholeNum > 10) wholeNum = 10;
      if (wholeNum < 1) wholeNum = 1;
      val = wholeNum.toString();
    }

    setScoreValue(val);
    if (val.includes(".")) {
      setDecimalValue(val.split(".")[1] || "");
    } else {
      setDecimalValue("");
    }
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
  const hasSavedSubmission = Boolean(submittedEntry);
  const isSubmissionLocked = Boolean(submittedEntry?.locked);
  const isViewingSavedSubmission = hasSavedSubmission && !isEditingSubmission;
  const isEntryLocked = isSubmissionLocked || isViewingSavedSubmission;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContestantData) {
      toast.error("Select a contestant first.");
      return;
    }

    if (!currentJudge.id) {
      toast.error("This judge link is not assigned to a saved judge.");
      return;
    }

    if (isSubmissionLocked) {
      toast.error("This submission is locked and can no longer be edited.");
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

    try {
      setIsSubmitting(true);
      const submittedScore = await submitJudgeScore(eventId, {
        judgeId: currentJudge.id,
        contestantId: selectedContestantData.id,
        score: activeScoreValue,
      });

      const nextSubmittedEntry = {
        contestantId: submittedScore?.contestantId ?? selectedContestantData.id,
        contestantName:
          submittedScore?.contestantName ?? selectedContestantData.name,
        rawScore: Number(submittedScore?.rawScore ?? activeScoreValue),
        locked: Boolean(submittedScore?.locked),
      };

      setSubmissionsByContestantId((prev) => ({
        ...prev,
        [selectedContestantData.id]: nextSubmittedEntry,
      }));
      setSubmittedEntry(nextSubmittedEntry);
      setIsEditingSubmission(false);
      toast.success(isPenaltyJudge ? "Penalty submitted." : "Score submitted.");
    } catch (error) {
      console.error(error);

      if (error?.response?.status === 409) {
        setSubmissionsByContestantId((prev) => {
          const savedEntry = prev[selectedContestantData.id];
          if (!savedEntry) return prev;

          return {
            ...prev,
            [selectedContestantData.id]: {
              ...savedEntry,
              locked: true,
            },
          };
        });
        setSubmittedEntry((prev) =>
          prev
            ? {
                ...prev,
                locked: true,
              }
            : prev,
        );
        setIsEditingSubmission(false);
      }

      const message =
        error?.response?.data?.message || "Failed to submit result.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmission = (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!submittedEntry || submittedEntry.locked) return;
    setIsEditingSubmission(true);
  };

  const handleCancelEdit = () => {
    const savedEntry = submissionsByContestantId[selectedContestant];
    if (!savedEntry) return;

    applyStoredScoreToInputs(savedEntry.rawScore, currentJudge.specialization, {
      setScoreValue,
      setDecimalValue,
      setDeductionValues,
      setPenaltyValue,
    });
    setSubmittedEntry(savedEntry);
    setIsEditingSubmission(false);
  };

  const handleContestantChange = (event) => {
    const nextContestantId = event.target.value;
    setSelectedContestant(nextContestantId);
    syncContestantSubmissionState(nextContestantId);
  };

  return {
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
  };
}
