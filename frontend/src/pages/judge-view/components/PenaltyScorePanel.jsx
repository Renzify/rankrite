function PenaltyScorePanel({
  formatScore,
  isDisabled,
  onPenaltyChange,
  parsedPenaltyValue,
  penaltyValue,
}) {
  return (
    <>
      <label className="mb-4 block text-center text-sm font-medium">
        Enter deduction / penalty:
      </label>

      <div className="mx-auto max-w-xs">
        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          className="input input-bordered input-lg w-full text-center text-3xl font-bold"
          value={penaltyValue}
          disabled={isDisabled}
          onChange={(event) => onPenaltyChange(event.target.value)}
        />
      </div>

      <div className="mt-4 text-center">
        <span className="text-lg text-base-content/70">Recorded Penalty:</span>
        <span className="text-2xl font-bold text-primary">
          {parsedPenaltyValue === null ? "--" : formatScore(parsedPenaltyValue)}
        </span>
      </div>
    </>
  );
}

export default PenaltyScorePanel;
