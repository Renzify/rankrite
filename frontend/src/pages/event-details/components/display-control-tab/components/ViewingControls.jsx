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

const FREEZE_OPTIONS = [
  {
    value: "live",
    label: "Live",
    description: "Display updates normally.",
  },
  {
    value: "frozen",
    label: "Frozen",
    description: "Hold the current frame on screen.",
  },
];

const OUTPUT_OPTIONS = [
  {
    value: "visible",
    label: "Visible",
    description: "Audience can see the live display.",
  },
  {
    value: "blackout",
    label: "Blackout",
    description: "Hide the audience output immediately.",
  },
];

function ViewingControls({
  viewMode,
  handlePrev,
  hasContestants,
  isFrozen,
  isBlackout,
  handleNext,
  handleFreezeStateChange,
  handleOutputStateChange,
  handleToggleAutoSwap,
  handleSwapSecondsChange,
  handleViewModeChange,
}) {
  return (
    <div>
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="app-muted-panel">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Viewing Mode</h3>
            <div
              className="tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200"
              data-tip="Viewing Mode: Controls how contestants are shown on the live display. It lets you choose between manual navigation or automatic rotation."
            >
              ?
            </div>
          </div>

          <fieldset className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {VIEW_MODE_OPTIONS.map((option) => {
              const isSelected = viewMode === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border pt-4 pl-3 pr-10 transition-all duration-200 ${
                    isSelected
                      ? "border-base-content/30 bg-base-100"
                      : "border-base-300/70 bg-base-200/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="view-mode"
                    className="radio radio-lg self-start mt-2"
                    checked={isSelected}
                    onChange={() => handleViewModeChange(option.value)}
                  />
                  <div className="flex flex-col items-center w-full text-center gap-1">
                    <div className="w-12 h-12 bg-base-200 rounded-xl flex items-center justify-center my-4">
                      {option.value === "manual" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
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
                          className="w-6 h-6"
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
                    <span className="block w-full max-w-xs leading-tight text-lg font-bold [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                      {option.label}
                    </span>
                    <span className="mb-5 block max-w-xs overflow-hidden text-sm text-base-content/70 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                      {option.description}
                    </span>
                  </div>
                </label>
              );
            })}
          </fieldset>

          {viewMode === "manual" ? (
            <div className="mt-10 flex flex-wrap gap-2 items-start">
              <div className="grid grid-cols-2 gap-2 w-full">
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
                    className="w-4 h-4"
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
                    className="w-4 h-4"
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
                      className="w-7 h-7"
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
                      className="w-7 h-7"
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
                  className="select select-bordered w-full select-sm"
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
        </div>

        <div className="app-muted-panel">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Emergency Controls</h3>
            <div
              className="tooltip tooltip-error tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-error bg-transparent text-error flex items-center justify-center text-sm font-medium cursor-help hover:bg-error hover:text-error-content transition-all duration-200"
              data-tip="Emergency Controls: Manage urgent display actions during interruptions or issues. Changes apply immediately to the live display."
            >
              ?
            </div>
          </div>
          <div className="mt-3 space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/60">
                Freeze State
              </legend>
              {FREEZE_OPTIONS.map((option) => {
                const isSelected =
                  option.value === "frozen" ? isFrozen : !isFrozen;

                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                      isSelected
                        ? "border-warning/40 bg-warning/10"
                        : "border-base-300/70 bg-base-200/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="freeze-state"
                      className="radio radio-sm radio-warning mt-0.5"
                      checked={isSelected}
                      onChange={() => handleFreezeStateChange(option.value)}
                    />
                    <span className="space-y-1">
                      <span className="block truncate text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="block overflow-hidden text-xs text-base-content/70 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/60">
                Output State
              </legend>
              {OUTPUT_OPTIONS.map((option) => {
                const isSelected =
                  option.value === "blackout" ? isBlackout : !isBlackout;

                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                      isSelected
                        ? "border-error/40 bg-error/10"
                        : "border-base-300/70 bg-base-200/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="output-state"
                      className="radio radio-sm radio-error mt-0.5"
                      checked={isSelected}
                      onChange={() => handleOutputStateChange(option.value)}
                    />
                    <span className="space-y-1">
                      <span className="block truncate text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="block overflow-hidden text-xs text-base-content/70 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          </div>
          <p className="mt-3 text-xs text-base-content/70">
            Freeze holds the current preview frame. Blackout hides the live
            output.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ViewingControls;
