function ConfirmDeleteModal({
  isOpen,
  title,
  name,
  descriptionLines = [],
  confirmLabel = "Delete",
  isDeleting = false,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-base-300 bg-base-100 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {name ? (
              <p className="text-sm text-base-content/70">{name}</p>
            ) : null}
          </div>
        </div>

        {descriptionLines.length ? (
          <div className="mt-4 space-y-2 text-sm text-base-content/80">
            {descriptionLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-error btn-sm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
