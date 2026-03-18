import React from "react";

function ComputationTable({
  contestants,
  selectedContestantId,
  handleContestantSelect,
  handleContestantRowKeyDown,
  difficultyScore,
  artistryScore,
  executionScore,
  penalties,
  totalScore,
  finalScore,
  formatEnteredValue,
}) {
  const getDisplayValue = (contestantValue, selectedFallback, isSelected) => {
    if (contestantValue !== null && contestantValue !== undefined) {
      return formatEnteredValue(contestantValue);
    }

    if (isSelected && selectedFallback !== null) {
      return formatEnteredValue(selectedFallback);
    }

    return "--";
  };

  return (
    <div>
      <table className="table min-w-[860px]">
        <thead>
          <tr>
            <th>Contestant</th>
            <th>Delegation</th>
            <th>D</th>
            <th>A</th>
            <th>E</th>
            <th>Penalties</th>
            <th>Total</th>
            <th>Final</th>
          </tr>
        </thead>
        <tbody>
          {contestants.length ? (
            contestants.map((contestant, index) => {
              const isSelected = contestant.id === selectedContestantId;

              return (
                <tr
                  key={contestant.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleContestantSelect(contestant.id)}
                  onKeyDown={(event) =>
                    handleContestantRowKeyDown(event, contestant.id)
                  }
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-base-200/90 outline outline-1 outline-base-300"
                      : "hover:bg-base-200/60"
                  }`}
                >
                  <td className="font-medium">
                    {index + 1}. {contestant.fullName}
                  </td>
                  <td>{contestant.delegation ?? contestant.teamName ?? "-"}</td>
                  <td>
                    {getDisplayValue(
                      contestant.dScore,
                      difficultyScore,
                      isSelected,
                    )}
                  </td>
                  <td>
                    {getDisplayValue(contestant.aScore, artistryScore, isSelected)}
                  </td>
                  <td>
                    {getDisplayValue(
                      contestant.eScore,
                      executionScore,
                      isSelected,
                    )}
                  </td>
                  <td>
                    {getDisplayValue(contestant.penalties, penalties, isSelected)}
                  </td>
                  <td>
                    {getDisplayValue(contestant.totalScore, totalScore, isSelected)}
                  </td>
                  <td>
                    {getDisplayValue(
                      contestant.finalScore ?? contestant.score,
                      finalScore,
                      isSelected,
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={10} className="text-base-content/60">
                No contestants available. Import contestants in the Contestants
                tab first.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ComputationTable;
