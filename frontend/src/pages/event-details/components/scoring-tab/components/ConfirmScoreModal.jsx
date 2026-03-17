function ConfirmScoreModal({
  isOpen,
  isConfirming = false,
  onClose,
  onConfirm,
  isUnlock = false,
  judgeName = "",
  score = "",
  scoreValue = null,
}) {
  if (!isOpen) return null;

  const title = isUnlock ? "Unlock Score" : "Confirm Score Lock";
  const description = isUnlock
    ? "Are you sure you want to unlock the score submission from this judge? This will allow the score to be modified again."
    : "Are you sure you want to lock the score submission from this judge?";
  const confirmation = isUnlock ? "Confirm Unlock" : "Confirm Lock";
  const warningText = isUnlock
    ? "Once unlocked, the score can be modified by the judge."
    : "Once locked, this score cannot be modified.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-base-content/70">
          Judge:{" "}
          <span className="font-medium text-base-content/90">{judgeName}</span>
        </p>

        <div className="mt-4 space-y-2 text-sm text-base-content/80">
          <p>{description}</p>
          {scoreValue !== null && (
            <p className="font-medium">
              Score Value: <span className="text-base-content/90">{score}</span>
            </p>
          )}
          <p className="text-xs text-base-content/60">{warningText}</p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={isConfirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn-sm ${isUnlock ? "btn-warning" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming
              ? `${isUnlock ? "Unlocking" : "Confirming"}...`
              : confirmation}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmScoreModal;
