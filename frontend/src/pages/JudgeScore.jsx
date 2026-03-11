import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router";
import { User } from "lucide-react";
import { getEventDetails } from "../api/eventApi";

const SCORE_RANGE = Array.from({ length: 10 }, (_, index) => index + 1);
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
  const [eventTitle, setEventTitle] = useState(eventTitleParam || "Judge Scoring");
  const [sportLabel, setSportLabel] = useState(sportParam);
  const [isLoading, setIsLoading] = useState(Boolean(eventId));
  const [loadError, setLoadError] = useState("");
  const [pageNotice, setPageNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAssignedContext = async () => {
      setCurrentJudge(fallbackJudge);
      setContestants([]);
      setSelectedContestant("");
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
          setCurrentJudge({
            id: matchedJudge.id,
            name: matchedJudge.fullName || fallbackJudge.name,
            specialization:
              matchedJudge.judgeType || fallbackJudge.specialization,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedContestantData) {
      toast.error("Select a contestant first.");
      return;
    }

    const payload = {
      eventId,
      judgeId: currentJudge.id,
      judgeName: currentJudge.name,
      contestantId: selectedContestantData.id,
      contestantName: selectedContestantData.name,
      score: getFinalScore(),
      eventTitle,
      sport: sportLabel,
    };

    console.log(payload);
    toast.success("Score captured locally.");
  };

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
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-content">
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

            {selectedContestantData && (
              <div className="mb-4 flex items-center gap-4 rounded-lg bg-base-200 p-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-lg">
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
            )}

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
              onChange={(e) => setSelectedContestant(e.target.value)}
              disabled={isLoading || Boolean(loadError) || !contestants.length}
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
            Select and submit scores for the current contestant
          </p>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold">
                  {currentJudge.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part.charAt(0))
                    .join("")
                    .toUpperCase() || "J"}
                </div>
                <div>
                  <p className="text-xs text-base-content/60 uppercase tracking-wider">
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
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-content font-bold">
                    {selectedContestantData.entryNo}
                  </div>
                  <div>
                    <p className="text-xs text-base-content/60 uppercase tracking-wider">
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
                <div className="flex flex-col items-center justify-center h-full py-4">
                  <p className="text-base-content/50 text-sm">
                    Select a Contestant
                  </p>
                </div>
              </div>
            )}
          </div>

          <hr className="border-base-300 mb-6" />

          <div className="mb-6">
            <label className="block text-sm font-medium mb-4 text-center">
              Select Score (1-10):
            </label>

            <div className="mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={handleDecrease}
                className="btn btn-circle btn-lg btn-outline"
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
                        style={{
                          left: "50%",
                          marginLeft: `${offset}px`,
                          transform: isSelected
                            ? "translateX(-50%) scale(1.8)"
                            : `translateX(-50%) scale(${Math.max(0.5, 1 - distance * 0.2)})`,
                          opacity: isSelected
                            ? 1
                            : Math.max(0.15, 1 - distance * 0.3),
                          fontSize: isSelected ? "2.5rem" : "1.25rem",
                          fontWeight: isSelected ? "800" : "400",
                          color: isSelected ? "var(--p, #3b82f6)" : "inherit",
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
              >
                +
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center">
                <input
                  type="text"
                  placeholder={getFinalScore()}
                  className="input input-bordered input-lg w-40 text-center text-3xl font-bold"
                  value={scoreValue}
                  onChange={handleScoreInputChange}
                />
              </div>
              <div className="text-center">
                <span className="text-lg text-base-content/70">Final Score: </span>
                <span className="text-2xl font-bold text-primary">
                  {getFinalScore()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <button
              type="submit"
              form="scoreForm"
              className="btn btn-primary w-full max-w-xl text-lg"
              disabled={isLoading || Boolean(loadError) || !selectedContestant}
            >
              Submit Score
            </button>
          </div>

          <form id="scoreForm" onSubmit={handleSubmit} className="hidden">
            <input type="hidden" name="score" value={getFinalScore()} />
          </form>
        </div>
      </div>
    </div>
  );
}

export default JudgeScore;
