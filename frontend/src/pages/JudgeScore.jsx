import React, { useState } from "react";
import { User } from "lucide-react";

function JudgeScore() {
  // Temporary data arrays
  // Single predefined judge (could be the logged-in judge)
  const currentJudge = {
    id: 1,
    name: "Chavit Singson",
    specialization: "Time Judge",
  };

  const contestants = [
    {
      id: 1,
      name: "Manuel Marc Barcelona",
      delegation: "Information and Communication Technology High School",
    },
    {
      id: 2,
      name: "Juan Dela Cruz",
      delegation: "Del Rosario Elementary School",
    },
    { id: 3, name: "Clark Bengco", delegation: "Asian Montessori Center Inc." },
    {
      id: 4,
      name: "Marky Mark Barcelona",
      delegation: "Achievers Special Education Center",
    },
  ];

  const [selectedJudge, setSelectedJudge] = useState(1);
  const [selectedContestant, setSelectedContestant] = useState("");
  const [scoreValue, setScoreValue] = useState("5.00");
  const [decimalValue, setDecimalValue] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Generate array 1-10 for slider
  const scoreRange = Array.from({ length: 10 }, (_, i) => i + 1);

  // Parse whole number from scoreValue
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

  // Calculate final score
  const getFinalScore = () => {
    const whole = getWholeNumber();
    const decimal = decimalValue
      ? parseFloat("0." + decimalValue.padStart(2, "0").slice(0, 2))
      : 0;
    return (whole + decimal).toFixed(2);
  };

  const handleScoreInputChange = (e) => {
    let val = e.target.value;
    // Allow only numbers and one decimal point
    val = val.replace(/[^0-9.]/g, "");
    const parts = val.split(".");

    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }

    // If there's a decimal point, validate whole number part
    if (val.includes(".")) {
      const wholePart = parts[0];
      // Clamp whole number between 1-10
      let wholeNum = parseInt(wholePart) || 1;
      if (wholeNum > 10) wholeNum = 10;
      if (wholeNum < 1) wholeNum = 1;

      const decimalPart = parts[1] || "";
      val = `${wholeNum}.${decimalPart.slice(0, 2)}`;
    } else if (val !== "") {
      // No decimal yet, just validate whole number
      let wholeNum = parseInt(val);
      if (wholeNum > 10) wholeNum = 10;
      if (wholeNum < 1) wholeNum = 1;
      val = wholeNum.toString();
    }

    setScoreValue(val);
    // Extract decimal for calculation
    if (val.includes(".")) {
      setDecimalValue(val.split(".")[1] || "");
    } else {
      setDecimalValue("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      judge: selectedJudge,
      contestant: selectedContestant,
      score: getFinalScore(),
    });
    alert(
      `Score submitted!\nJudge: ${selectedJudge}\nContestant: ${selectedContestant}\nScore: ${getFinalScore()}`,
    );
  };

  const getContestantDisplay = () => {
    if (!selectedContestant) return null;
    return contestants.find((c) => c.id === parseInt(selectedContestant));
  };

  const selectedContestantData = getContestantDisplay();

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="flex flex-col items-center">
        {/* H1 Judge Scoring */}
        <div className="w-4/5 flex-start">
          <h1 className="text-3xl font-bold mb-8">Official Judging Panel</h1>
        </div>

        {/* Two div boxes side by side - 80% of screen */}
        <div className="flex flex-row gap-4 w-4/5 mb-8">
          {/* Left box - Authorized Judge */}
          <div className="flex-1 border border-base-300 bg-base-100 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Authorized Judge</h2>
            <p className="text-base-content/70 mb-4">
              Reserved for accredited judges to record contestant scores.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <hr className="flex-1 border-base-300" />
              <span className="text-sm font-medium whitespace-nowrap">
                Assigned Judge:
              </span>
              <hr className="flex-1 border-base-300" />
            </div>
            <div
              className={`flex items-center gap-4 p-4 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition-colors ${selectedJudge ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedJudge(currentJudge.id)}
            >
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

          {/* Right box - Current Contestant */}
          <div className="flex-1 border border-base-300 bg-base-100 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Current Contestant</h2>
            <p className="text-base-content/70 mb-4">
              Representing delegation or team.
            </p>

            {/* Selected Contestant Info Box */}
            {selectedContestantData && (
              <div className="flex items-center gap-4 p-4 bg-base-200 rounded-lg mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-lg">
                  {selectedContestantData.id}
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

            <div className="flex items-center gap-2 mb-4">
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
            >
              <option value="">-- Select a Contestant --</option>
              {contestants.map((contestant) => (
                <option key={contestant.id} value={contestant.id}>
                  Contestant #{contestant.id} - {contestant.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Score Table box - 80% of screen */}
        <div className="w-4/5 border border-base-300 bg-base-100 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Score Table</h2>
          <p className="text-base-content/70 mb-4">
            Select and submit scores for the current contestant
          </p>

          {/* Judge and Contestant Info - Side by Side Cards */}
          <div className="flex gap-4 mb-6">
            {/* Judge Info Card */}
            {selectedJudge ? (
              <div className="flex-1 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold">
                    {currentJudge.id}
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
            ) : (
              <div className="flex-1 bg-base-200 rounded-lg p-4 border border-base-200">
                <div className="flex flex-col items-center justify-center h-full py-4">
                  <p className="text-base-content/50 text-sm">Select a Judge</p>
                </div>
              </div>
            )}

            {/* Contestant Info Card */}
            {selectedContestantData ? (
              <div className="flex-1 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg p-4 border border-secondary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-content font-bold">
                    {selectedContestantData.id}
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
              <div className="flex-1 bg-base-200 rounded-lg p-4 border border-base-200">
                <div className="flex flex-col items-center justify-center h-full py-4">
                  <p className="text-base-content/50 text-sm">
                    Select a Contestant
                  </p>
                </div>
              </div>
            )}
          </div>

          <hr className="border-base-300 mb-6" />

          {/* Score Slider - Fixed Carousel Style */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-4 text-center">
              Select Score (1-10):
            </label>

            {/* Carousel Slider */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                type="button"
                onClick={handleDecrease}
                className="btn btn-circle btn-lg btn-outline"
              >
                -
              </button>

              {/* Fixed Width Container - Wider to properly center */}
              <div className="relative w-[500px] h-28 overflow-hidden bg-base-200 rounded-lg">
                {/* Numbers positioned absolutely to center the selected one */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {scoreRange.map((num) => {
                    const isSelected = num === getWholeNumber();
                    const distance = Math.abs(num - getWholeNumber());
                    // Position: selected number at center (0px offset), others offset by 60px each
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

                {/* Center Indicator Line - Positioned exactly at center with 50% opacity */}
                {/* Removed vertical center indicator */}
              </div>

              <button
                type="button"
                onClick={handleIncrease}
                className="btn btn-circle btn-lg btn-outline"
              >
                +
              </button>
            </div>

            {/* Combined Score Display - Single Input Field */}
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
                <span className="text-lg text-base-content/70">
                  Final Score:{" "}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {getFinalScore()}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              form="scoreForm"
              className="btn btn-primary w-[600px] text-lg"
            >
              Submit Score
            </button>
          </div>

          {/* Hidden Form for submission */}
          <form id="scoreForm" onSubmit={handleSubmit} className="hidden">
            <input type="hidden" name="score" value={getFinalScore()} />
          </form>
        </div>
      </div>
    </div>
  );
}

export default JudgeScore;
