const SCORE_RANGE = Array.from({ length: 10 }, (_, index) => index + 1);

function DifficultyScorePanel({
  finalScore,
  isDisabled,
  onDecrease,
  onIncrease,
  onScoreInputChange,
  onScoreSelect,
  scoreValue,
  selectedWholeNumber,
}) {
  return (
    <>
      <label className="mb-4 block text-center text-sm font-medium">
        Select Score (1-10):
      </label>

      <div className="mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onDecrease}
          className="btn btn-circle btn-md btn-outline sm:btn-lg"
          disabled={isDisabled}
        >
          -
        </button>

        <div className="relative h-28 overflow-hidden rounded-lg bg-base-200">
          <div className="absolute inset-0 flex items-center justify-center">
            {SCORE_RANGE.map((num) => {
              const isSelected = num === selectedWholeNumber;
              const distance = Math.abs(num - selectedWholeNumber);
              const offset = (num - selectedWholeNumber) * 48;

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onScoreSelect(num)}
                  className="absolute transition-all duration-300 ease-out"
                  disabled={isDisabled}
                  style={{
                    left: "50%",
                    marginLeft: `${offset}px`,
                    transform: isSelected
                      ? "translateX(-50%) scale(1.8)"
                      : `translateX(-50%) scale(${Math.max(0.5, 1 - distance * 0.2)})`,
                    opacity: isSelected ? 1 : Math.max(0.15, 1 - distance * 0.3),
                    fontSize: isSelected ? "2.5rem" : "1.25rem",
                    fontWeight: isSelected ? "800" : "400",
                    color: isSelected ? "var(--color-primary)" : "inherit",
                    zIndex: isSelected ? 10 : 1,
                  }}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onIncrease}
          className="btn btn-circle btn-md btn-outline sm:btn-lg"
          disabled={isDisabled}
        >
          +
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center">
          <input
            type="text"
            placeholder={finalScore}
            className="input input-bordered input-lg w-32 text-center text-2xl font-bold sm:w-40 sm:text-3xl"
            value={scoreValue}
            disabled={isDisabled}
            onChange={onScoreInputChange}
          />
        </div>
        <div className="text-center">
          <span className="text-lg text-base-content/70">Final Score: </span>
          <span className="text-2xl font-bold text-primary">{finalScore}</span>
        </div>
      </div>
    </>
  );
}

export default DifficultyScorePanel;
