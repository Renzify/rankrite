import QRCode from "react-qr-code";

export default function JudgeLinkModal({
  activeJudgeLink,
  activeJudgeName,
  copyMessage,
  isOpen,
  linkModalTab,
  onClose,
  onCopyLink,
  onTabChange,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-base-300 bg-base-100 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Judge Scoring Access</h3>
            <p className="text-sm text-base-content/70">{activeJudgeName}</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div
          role="tablist"
          className="tabs tabs-boxed mt-4 w-fit gap-1 bg-base-200/50"
        >
          <button
            type="button"
            role="tab"
            className={`tab ${linkModalTab === "qr" ? "tab-active" : ""}`}
            onClick={() => onTabChange("qr")}
          >
            QR
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${linkModalTab === "link" ? "tab-active" : ""}`}
            onClick={() => onTabChange("link")}
          >
            Link
          </button>
        </div>

        <div className="mt-4">
          {linkModalTab === "qr" ? (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-xl border border-base-300 bg-white p-4">
                <QRCode
                  value={activeJudgeLink || " "}
                  size={224}
                  bgColor="#ffffff"
                  fgColor="#111827"
                />
              </div>
              <p className="text-center text-xs text-base-content/60">
                Scan this QR to open the judge scoring page.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="form-control w-full">
                <div className="label pb-1">
                  <span className="label-text font-semibold">Scoring Link</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={activeJudgeLink}
                  readOnly
                />
              </label>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={activeJudgeLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-neutral btn-sm"
                >
                  Open Link
                </a>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={onCopyLink}
                >
                  Copy Link
                </button>
                {copyMessage ? (
                  <span className="text-xs text-base-content/70">
                    {copyMessage}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
