function DeductionScorePanel({
  calculatedMedianScore,
  deductionValues,
  formatScore,
  isDisabled,
  medianDeduction,
  onAddDeductionInput,
  onDeductionInputChange,
  onRemoveDeductionInput,
}) {
  return (
    <>
      <label className="mb-4 block text-center text-sm font-medium">
        Enter deductions:
      </label>

      <div className="space-y-3">
        {deductionValues.map((value, index) => (
          <div
            key={`deduction_${index}`}
            className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end"
          >
            <label className="form-control flex-1">
              <div className="label pb-1">
                <span className="label-text font-semibold">
                  Deduction {index + 1}
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className="input input-bordered w-full"
                value={value}
                disabled={isDisabled}
                onChange={(event) =>
                  onDeductionInputChange(index, event.target.value)
                }
              />
            </label>
            <button
              type="button"
              className="btn btn-outline btn-sm w-full sm:w-auto"
              onClick={() => onRemoveDeductionInput(index)}
              disabled={isDisabled || deductionValues.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onAddDeductionInput}
          disabled={isDisabled}
        >
          Add Deduction
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-base-300 bg-base-200/50 p-4 text-center">
          <p className="text-sm font-medium text-base-content/70">
            Median Deduction
          </p>
          <p className="mt-2 text-3xl font-bold">
            {medianDeduction === null ? "--" : formatScore(medianDeduction)}
          </p>
        </div>

        <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-4 text-center">
          <p className="text-sm font-medium text-base-content/70">
            Calculated Score
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {calculatedMedianScore === null
              ? "--"
              : formatScore(calculatedMedianScore)}
          </p>
          <p className="mt-1 text-xs text-base-content/60">
            10 - median deduction
          </p>
        </div>
      </div>
    </>
  );
}

export default DeductionScorePanel;
