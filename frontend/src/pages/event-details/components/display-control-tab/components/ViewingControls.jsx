import InfoTooltip from "../../../../../shared/components/InfoTooltip";

const VIEW_MODE_OPTIONS = [
  {
    value: "manual",
    label: "Manual Swapping",
    description: "Operator advances the audience display manually.",
  },
  {
    value: "auto",
    label: "Automatic Swapping",
    description:
      "Rotate contestants automatically using the selected interval.",
  },
];

function ViewingControls({
  swapMode,
  handlePrev,
  hasContestants,
  isFrozen,
  isBlackout,
  handleNext,
  handleToggleAutoSwap,
  handleSwapSecondsChange,
  handleSwapModeChange,
  isAutoRunning,
  swapSeconds,
}) {
  return (
    <div className="app-muted-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">One-By-One Controls</h3>
        <InfoTooltip content="Viewing Mode: Controls how scored contestants are shown on the live display. It lets you choose between manual navigation or automatic rotation." />
      </div>

      <fieldset className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        {VIEW_MODE_OPTIONS.map((option) => {
          const isSelected = swapMode === option.value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border pb-4 pl-3 pr-10 pt-4 transition-all duration-200 ${
                isSelected
                  ? "border-base-content/30 bg-base-100"
                  : "border-base-300/70 bg-base-200/30"
              }`}
            >
              <input
                type="radio"
                name="swap-mode"
                className="radio radio-lg mt-2 self-start"
                checked={isSelected}
                onChange={() => handleSwapModeChange(option.value)}
              />
              <div className="flex w-full flex-col items-center gap-1 text-center">
                <div className="my-4 flex h-12 w-12 items-center justify-center rounded-xl bg-base-200">
                  {option.value === "manual" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-6 w-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-6 w-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  )}
                </div>
                <span className="block w-full max-w-xs text-lg font-bold leading-tight [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {option.label}
                </span>
                <span className="block max-w-xs overflow-hidden text-sm text-base-content/70 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {option.description}
                </span>
              </div>
            </label>
          );
        })}
      </fieldset>

      {swapMode === "manual" ? (
        <div className="mt-10 flex flex-wrap items-start gap-2">
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="btn btn-sm btn-outline flex items-center gap-2"
              onClick={handlePrev}
              disabled={!hasContestants || isFrozen || isBlackout}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous Contestant
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline flex items-center gap-2"
              onClick={handleNext}
              disabled={!hasContestants || isFrozen || isBlackout}
            >
              Next Contestant
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-3 sm:flex-nowrap">
          <button
            type="button"
            className="btn btn-sm btn-outline flex w-full items-center justify-center gap-2 sm:min-w-[12rem] sm:w-auto"
            onClick={handleToggleAutoSwap}
            disabled={!hasContestants || isFrozen || isBlackout}
          >
            {isAutoRunning ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-7 w-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6"
                  />
                </svg>
                Pause Auto Swap
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-7 w-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                </svg>
                Resume Auto Swap
              </>
            )}
          </button>

          <label className="form-control w-full sm:min-w-[13rem] sm:w-auto">
            <div className="label pb-1">
              <span className="label-text">Auto swap interval:</span>
            </div>
            <select
              className="select select-bordered select-sm w-full"
              value={swapSeconds}
              onChange={handleSwapSecondsChange}
            >
              <option value={3}>3 seconds</option>
              <option value={5}>5 seconds</option>
              <option value={8}>8 seconds</option>
              <option value={10}>10 seconds</option>
            </select>
          </label>
        </div>
      )}

      <p className="mt-3 text-xs text-base-content/70">
        Only contestants with scores are included in one-by-one rotation.
      </p>
    </div>
  );
}

export default ViewingControls;
