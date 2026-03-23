function PenaltyScorePanel({
  formatScore,
  inputLabel = "Enter deduction / penalty:",
  isDisabled,
  maxValue,
  onValueChange,
  parsedValue,
  value,
  valueLabel = "Recorded Penalty:",
}) {
  return (
    <>
      <label className="mb-4 block text-center text-sm font-medium">
        {inputLabel}
      </label>

      <div className="mx-auto max-w-xs">
        <input
          type="number"
          min="0"
          max={maxValue}
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          className="input input-bordered input-lg w-full text-center text-3xl font-bold"
          value={value}
          disabled={isDisabled}
          onChange={(event) => onValueChange(event.target.value)}
        />
      </div>

      <div className="mt-4 text-center">
        <span className="text-lg text-base-content/70">{valueLabel}</span>
        <span className="text-2xl font-bold text-primary">
          {parsedValue === null ? "--" : formatScore(parsedValue)}
        </span>
      </div>
    </>
  );
}

export default PenaltyScorePanel;