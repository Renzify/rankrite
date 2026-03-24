import React from "react";
import { formatScoreValue } from "../../../../../shared/lib/scoreFormatting";

function ContestantList({
  scoredContestants,
  unscoredContestants,
  safeActiveIndex,
  nextIndex,
  isBlackout,
  displayLayout,
}) {
  const orderedContestants = [...scoredContestants, ...unscoredContestants];

  return (
    <div>
      <table className="table table-zebra min-w-[680px]">
        <thead>
          <tr>
            <th>#</th>
            <th>Contestant</th>
            <th>Delegation</th>
            <th>Score</th>
            <th>Preview State</th>
          </tr>
        </thead>
        <tbody>
          {orderedContestants.length ? (
            orderedContestants.map((contestant, index) => {
              const isScored = index < scoredContestants.length;
              const scoredIndex = isScored ? index : -1;
              const isLive =
                displayLayout === "one-by-one" && safeActiveIndex === scoredIndex;
              const isNext =
                displayLayout === "one-by-one" && nextIndex === scoredIndex;

              let statusClassName = "badge-ghost";
              let statusText = "No score yet";

              if (isScored) {
                if (displayLayout === "one-by-one") {
                  statusClassName = isLive
                    ? isBlackout
                      ? "badge-error"
                      : "badge-success"
                    : isNext
                      ? "badge-info"
                      : "badge-ghost";
                  statusText = isLive
                    ? isBlackout
                      ? "Hidden"
                      : "Live"
                    : isNext
                      ? "Next"
                      : "Queued";
                } else {
                  statusClassName = isBlackout
                    ? "badge-error"
                    : scoredIndex === 0
                      ? "badge-success"
                      : "badge-info";
                  statusText = isBlackout
                    ? "Hidden"
                    : scoredIndex === 0
                      ? "Leader"
                      : `Rank ${scoredIndex + 1}`;
                }
              }

              return (
                <tr key={contestant.id ?? `${contestant.displayName}-${index}`}>
                  <th>{index + 1}</th>
                  <td
                    className="max-w-[11rem] truncate sm:max-w-[16rem]"
                    title={contestant.displayName}
                  >
                    {contestant.displayName}
                  </td>
                  <td
                    className="max-w-[10rem] truncate sm:max-w-[14rem]"
                    title={contestant.displayDelegation}
                  >
                    {contestant.displayDelegation}
                  </td>
                  <td>{formatScoreValue(contestant.scoreValue, "--")}</td>
                  <td>
                    <span className={`badge ${statusClassName}`}>{statusText}</span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="text-base-content/60">
                No contestants available. Import contestants in Contestants tab
                first.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ContestantList;
