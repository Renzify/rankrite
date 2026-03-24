import InfoTooltip from "../../../../../shared/components/InfoTooltip";

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

function EmergencyControls({
  isFrozen,
  isBlackout,
  handleFreezeStateChange,
  handleOutputStateChange,
}) {
  return (
    <div className="app-muted-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Emergency Controls</h3>
        <InfoTooltip
          tone="error"
          content="Emergency Controls: Manage urgent display actions during interruptions or issues. Changes apply immediately to the live display."
        />
      </div>

      <div className="mt-3 space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/60">
            Freeze State
          </legend>
          {FREEZE_OPTIONS.map((option) => {
            const isSelected = option.value === "frozen" ? isFrozen : !isFrozen;

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
                  <span className="block text-sm font-semibold">
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
                  <span className="block text-sm font-semibold">
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
        Freeze holds the current preview frame. Blackout hides the live output.
      </p>
    </div>
  );
}

export default EmergencyControls;
