import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocation } from "react-router";
import {
  getJudgeAccessContext,
  submitJudgeAccessScore,
} from "../../../api/judgeAccessApi";

const DEFAULT_SCORE_VALUE = "5.00";
const POLL_INTERVAL_MS = 3000;

function buildFallbackJudge() {
  return {
    id: "",
    name: "Assigned Judge",
    specialization: "Judge",
  };
}

function getJudgeAccessToken(location) {
  const searchParams = new URLSearchParams(location.search);
  const queryToken = String(searchParams.get("access") ?? "").trim();

  if (queryToken) {
    return queryToken;
  }

  const hashValue = location.hash.startsWith("#")
    ? location.hash.slice(1)
    : location.hash;
  const hashParams = new URLSearchParams(hashValue);

  return String(hashParams.get("access") ?? "").trim();
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

function hasContestantId(contestants, contestantId) {
  if (!contestantId) {
    return false;
  }

  return contestants.some((contestant) => contestant.id === contestantId);
}

function resolveEventActiveContestantId(contestants, activeContestantId) {
  const normalizedContestantId = String(activeContestantId ?? "").trim();

  if (!normalizedContestantId) {
    return "";
  }

  return hasContestantId(contestants, normalizedContestantId)
    ? normalizedContestantId
    : "";
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

function buildJudgeFromContext(contextJudge, fallbackJudge) {
  if (!contextJudge) {
    return fallbackJudge;
  }

  return {
    id: contextJudge.id || fallbackJudge.id,
    name: contextJudge.fullName || fallbackJudge.name,
    specialization: contextJudge.judgeType || fallbackJudge.specialization,
  };
}

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || fallbackMessage;
}

export function useJudgeScoring() {
  const location = useLocation();
  const { hash, search } = location;
  const accessToken = useMemo(
    () => getJudgeAccessToken({ hash, search }),
    [hash, search],
  );
  const fallbackJudge = useMemo(() => buildFallbackJudge(), []);

  const [selectedContestant, setSelectedContestant] = useState("");
  const [scoreValue, setScoreValue] = useState(DEFAULT_SCORE_VALUE);
  const [decimalValue, setDecimalValue] = useState("");
  const [currentJudge, setCurrentJudge] = useState(fallbackJudge);
  const [contestants, setContestants] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));
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
      setLoadError("");
      setPageNotice("");

      if (!accessToken) {
        setIsLoading(false);
        setLoadError("This judge access link is missing its secure access token.");
        return;
      }

      setIsLoading(true);

      try {
        const data = await getJudgeAccessContext(accessToken);
        if (!isMounted) return;

        const nextJudge = buildJudgeFromContext(data.judge, fallbackJudge);
        const nextContestants = normalizeContestants(data.contestants ?? []);
        const nextSubmissionsByContestantId = buildSubmissionsByContestantId(
          data.judgeScores ?? [],
          nextJudge.id,
        );
        const nextActiveContestantId = resolveEventActiveContestantId(
          nextContestants,
          data.event?.activeContestantId,
        );

        setCurrentJudge(nextJudge);
        setContestants(nextContestants);
        setSubmissionsByContestantId(nextSubmissionsByContestantId);
        setSelectedContestant(nextActiveContestantId);

        if (!nextContestants.length) {
          setPageNotice("No contestants are available for scoring yet.");
        } else if (!nextActiveContestantId) {
          setPageNotice("Waiting for the admin to set the active contestant.");
        }
      } catch (error) {
        console.error(error);
        if (!isMounted) return;

        setCurrentJudge(fallbackJudge);
        setLoadError(
          getErrorMessage(error, "Failed to load the assigned judge access."),
        );
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
  }, [accessToken, fallbackJudge]);

  useEffect(() => {
    if (isLoading || loadError || !accessToken || !currentJudge.id) {
      return undefined;
    }

    let isMounted = true;

    const syncJudgeContext = async () => {
      try {
        const data = await getJudgeAccessContext(accessToken);
        if (!isMounted) return;

        const nextJudge = buildJudgeFromContext(data.judge, fallbackJudge);
        const nextContestants = normalizeContestants(data.contestants ?? []);
        const nextSubmissionMap = buildSubmissionsByContestantId(
          data.judgeScores ?? [],
          nextJudge.id,
        );
        const nextActiveContestantId = resolveEventActiveContestantId(
          nextContestants,
          data.event?.activeContestantId,
        );

        setCurrentJudge(nextJudge);
        setSubmissionsByContestantId((prev) =>
          mergeSubmissionMaps(prev, nextSubmissionMap),
        );
        setContestants(nextContestants);
        setSelectedContestant((previousContestantId) =>
          previousContestantId === nextActiveContestantId
            ? previousContestantId
            : nextActiveContestantId,
        );

        if (!nextContestants.length) {
          setPageNotice("No contestants are available for scoring yet.");
        } else if (!nextActiveContestantId) {
          setPageNotice("Waiting for the admin to set the active contestant.");
        } else {
          setPageNotice("");
        }
      } catch (error) {
        console.error("Failed to refresh judge access:", error);
        if (!isMounted) return;

        if ([401, 403, 404].includes(error?.response?.status)) {
          setLoadError(
            getErrorMessage(error, "This judge access link is no longer valid."),
          );
        }
      }
    };

    syncJudgeContext();

    const pollId = window.setInterval(() => {
      syncJudgeContext();
    }, POLL_INTERVAL_MS);

    const handleWindowFocus = () => {
      syncJudgeContext();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [accessToken, currentJudge.id, fallbackJudge, isLoading, loadError]);

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
      toast.error("No active contestant is assigned yet.");
      return;
    }

    if (!currentJudge.id) {
      toast.error("This judge link is not assigned to a saved judge.");
      return;
    }

    if (!accessToken) {
      toast.error("This judge access link is missing its secure token.");
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
      const submittedScore = await submitJudgeAccessScore(accessToken, {
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

      const responseMessage = String(error?.response?.data?.message ?? "");
      const isLockedResponse =
        error?.response?.status === 409 &&
        responseMessage.toLowerCase().includes("locked");

      if (isLockedResponse) {
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

      toast.error(getErrorMessage(error, "Failed to submit result."));
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
