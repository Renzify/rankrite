import React from "react";

function ComputationTable({
  contestants,
  selectedContestantId,
  handleContestantSelect,
  handleContestantRowKeyDown,
  difficultyScore,
  formatEnteredValue,
}) {
  return (
    <div>
      <table className="table">
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
                    {" "}
                    {index + 1 + ". "}
                    {contestant.fullName}
                  </td>
                  <td>{contestant.delegation}</td>
                  <td>
                    {isSelected && difficultyScore !== null
                      ? formatEnteredValue(difficultyScore)
                      : "--"}
                  </td>
                  <td>--</td>
                  <td>--</td>
                  <td>--</td>
                  <td>--</td>
                  <td>--</td>
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
