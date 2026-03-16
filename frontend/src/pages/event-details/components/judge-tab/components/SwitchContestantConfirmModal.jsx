import { forwardRef, useImperativeHandle, useState } from "react";

const INITIAL_MODAL_STATE = {
  isOpen: false,
  currentContestantLabel: "",
  nextContestantLabel: "",
  onConfirm: null,
  isSubmitting: false,
};

const SwitchContestantConfirmModal = forwardRef(function SwitchContestantConfirmModal(
  _props,
  ref,
) {
  const [modalState, setModalState] = useState(INITIAL_MODAL_STATE);

  const closeModal = () => {
    setModalState(INITIAL_MODAL_STATE);
  };

  useImperativeHandle(ref, () => ({
    close: closeModal,
    open: ({ currentContestantLabel, nextContestantLabel, onConfirm }) => {
      setModalState({
        isOpen: true,
        currentContestantLabel: currentContestantLabel || "No active contestant",
        nextContestantLabel: nextContestantLabel || "Unknown contestant",
        onConfirm: typeof onConfirm === "function" ? onConfirm : null,
        isSubmitting: false,
      });
    },
  }));

  const handleClose = () => {
    if (modalState.isSubmitting) return;
    closeModal();
  };

  const handleConfirm = async () => {
    if (!modalState.onConfirm) {
      closeModal();
      return;
    }

    setModalState((prev) => ({
      ...prev,
      isSubmitting: true,
    }));

    try {
      await modalState.onConfirm();
      closeModal();
    } catch {
      setModalState((prev) => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  };

  if (!modalState.isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-base-300 bg-base-100 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Switch Active Contestant</h3>
            <p className="text-sm text-base-content/70">
              Confirm before changing the judge-facing contestant context.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleClose}
            disabled={modalState.isSubmitting}
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3 rounded-lg border border-base-300 bg-base-200 p-4 text-sm">
          <div>
            <p className="font-medium text-base-content/70">Current active</p>
            <p className="mt-1 font-semibold">{modalState.currentContestantLabel}</p>
          </div>
          <div>
            <p className="font-medium text-base-content/70">Switch to</p>
            <p className="mt-1 font-semibold">{modalState.nextContestantLabel}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClose}
            disabled={modalState.isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-neutral"
            onClick={handleConfirm}
            disabled={modalState.isSubmitting}
          >
            {modalState.isSubmitting ? "Switching..." : "Confirm Switch"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default SwitchContestantConfirmModal;
