import React from "react";

function ContestantList({
  contestants,
  safeActiveIndex,
  nextIndex,
  isBlackout,
}) {
  return (
    <div>
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>#</th>
            <th>Contestant</th>
            <th>Delegation</th>
            <th>Preview State</th>
          </tr>
        </thead>
        <tbody>
          {contestants.length ? (
            contestants.map((contestant, index) => {
              const isLive = safeActiveIndex === index;
              const isNext = nextIndex === index;

              return (
                <tr key={contestant.id}>
                  <th>{index + 1}</th>
                  <td
                    className="max-w-[11rem] truncate sm:max-w-[16rem]"
                    title={contestant.fullName}
                  >
                    {contestant.fullName}
                  </td>
                  <td
                    className="max-w-[10rem] truncate sm:max-w-[14rem]"
                    title={contestant.delegation}
                  >
                    {contestant.delegation}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        isLive
                          ? isBlackout
                            ? "badge-error"
                            : "badge-success"
                          : isNext
                            ? "badge-info"
                            : "badge-ghost"
                      }`}
                    >
                      {isLive
                        ? isBlackout
                          ? "Hidden"
                          : "Live"
                        : isNext
                          ? "Next"
                          : "Queued"}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} className="text-base-content/60">
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
