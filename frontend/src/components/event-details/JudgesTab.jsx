import { useState } from "react";
import QRCode from "react-qr-code";
import { useOutletContext } from "react-router";
import { useTemplateStore } from "../../stores/templateStore";

const JUDGE_TYPE_OPTIONS = [
  "Difficulty Body",
  "Difficulty Apparatus",
  "Artistry",
  "Execution",
  "Time Judge",
  "Line Judge",
];

function createLocalId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random()}`;
}

export default function JudgesTab({ showLinkGeneration }) {
  const outletContext = useOutletContext() ?? {};
  const storeJudges = useTemplateStore((state) => state.judges);
  const storeSetJudges = useTemplateStore((state) => state.setJudges);

  const judges = outletContext.judges ?? storeJudges;
  const setJudges = outletContext.setJudges ?? storeSetJudges;
  const eventDetails = outletContext.eventDetails;
  const eventTitle = outletContext.eventTitle ?? "";
  const selectedSport = outletContext.selectedSport ?? "";
  const onCreateJudge = outletContext.onCreateJudge;
  const onUpdateJudge = outletContext.onUpdateJudge;
  const isSavingJudge = outletContext.isSavingJudge ?? false;

  const [formData, setFormData] = useState({
    fullName: "",
    judgeType: "",
    judgeNumber: "",
  });
  const [editingJudgeId, setEditingJudgeId] = useState(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalTab, setLinkModalTab] = useState("qr");
  const [activeJudgeName, setActiveJudgeName] = useState("");
  const [activeJudgeLink, setActiveJudgeLink] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const eventId = eventDetails?.event?.id ?? "";
  const shouldShowLinkGeneration =
    showLinkGeneration ?? Boolean(eventDetails?.event?.id);
  const canSubmitJudge = Boolean(
    formData.fullName.trim() &&
    formData.judgeType &&
    Number.parseInt(formData.judgeNumber, 10) > 0,
  );

  const resetForm = () => {
    setFormData({
      fullName: "",
      judgeType: "",
      judgeNumber: "",
    });
    setEditingJudgeId(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleJudgeSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmitJudge) return;

    const nextJudge = {
      fullName: formData.fullName.trim(),
      judgeType: formData.judgeType,
      judgeNumber: Number.parseInt(formData.judgeNumber, 10),
    };

    if (editingJudgeId) {
      if (onUpdateJudge) {
        try {
          await onUpdateJudge(editingJudgeId, nextJudge);
        } catch {
          return;
        }
      } else {
        setJudges((prev) =>
          prev.map((judge) =>
            judge.id === editingJudgeId ? { ...judge, ...nextJudge } : judge,
          ),
        );
      }
    } else if (onCreateJudge) {
      try {
        await onCreateJudge(nextJudge);
      } catch {
        return;
      }
    } else {
      setJudges((prev) => [
        ...prev,
        {
          id: createLocalId(),
          ...nextJudge,
        },
      ]);
    }

    resetForm();
  };

  const handleStartEditing = (judge) => {
    setEditingJudgeId(judge.id);
    setFormData({
      fullName: judge.fullName ?? "",
      judgeType: judge.judgeType ?? "",
      judgeNumber:
        judge.judgeNumber === null || judge.judgeNumber === undefined
          ? ""
          : String(judge.judgeNumber),
    });
  };

  const handleCancelEditing = () => {
    resetForm();
  };

  const actionButtonLabel = editingJudgeId
    ? isSavingJudge
      ? "Saving..."
      : "Save Changes"
    : isSavingJudge
      ? "Submitting..."
      : "Submit";

  const emptyJudgeColSpan = shouldShowLinkGeneration ? 6 : 5;

  const handleGenerateLink = (judge) => {
    if (!eventId) return;

    setActiveJudgeName(judge.fullName);
    setActiveJudgeLink(createJudgeScoringLink(judge));
    setLinkModalTab("qr");
    setCopyMessage("");
    setIsLinkModalOpen(true);
  };

  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    setCopyMessage("");
  };

  const handleCopyLink = async () => {
    if (!activeJudgeLink) return;

    try {
      await navigator.clipboard.writeText(activeJudgeLink);
      setCopyMessage("Link copied.");
    } catch {
      setCopyMessage("Unable to copy automatically.");
    }
  };

  const createJudgeScoringLink = (judge) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams();

    if (eventId) params.set("eventId", eventId);
    if (eventTitle) params.set("eventTitle", eventTitle);
    if (selectedSport) params.set("sport", selectedSport);
    if (judge.id) params.set("judgeId", judge.id);
    if (judge.fullName) params.set("judgeName", judge.fullName);
    if (judge.judgeType) params.set("judgeType", judge.judgeType);

    const queryString = params.toString();
    return `${baseUrl}/judge-score${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <>
      <div className="w-full space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Manage Judges</h2>
          {editingJudgeId ? (
            <span className="badge badge-outline badge-lg">Editing Judge</span>
          ) : null}
        </div>

        <form
          className="grid gap-4 sm:grid-cols-[1.4fr_1fr_0.8fr_auto]"
          onSubmit={handleJudgeSubmit}
        >
          <label className="form-control w-full">
            <div className="label pb-1">
              <span className="label-text font-semibold">Full Name</span>
            </div>
            <input
              type="text"
              name="fullName"
              className="input input-bordered w-full"
              placeholder="e.g. Maria Santos"
              value={formData.fullName}
              onChange={handleInputChange}
            />
          </label>

          <label className="form-control w-full">
            <div className="label pb-1">
              <span className="label-text font-semibold">Judge Type</span>
            </div>
            <select
              name="judgeType"
              className="select select-bordered w-full"
              value={formData.judgeType}
              onChange={handleInputChange}
            >
              <option value="">-- Select Judge Type --</option>
              {JUDGE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control w-full">
            <div className="label pb-1">
              <span className="label-text font-semibold">Judge Seat</span>
            </div>
            <input
              type="number"
              name="judgeNumber"
              min="1"
              className="input input-bordered w-full"
              placeholder="1"
              value={formData.judgeNumber}
              onChange={handleInputChange}
            />
          </label>

          <div className="flex items-end gap-2">
            {editingJudgeId ? (
              <button
                type="button"
                className="btn btn-outline w-full sm:w-auto"
                onClick={handleCancelEditing}
                disabled={isSavingJudge}
              >
                Cancel
              </button>
            ) : null}
            <button
              type="submit"
              className="btn btn-neutral w-full sm:w-auto"
              disabled={!canSubmitJudge || isSavingJudge}
            >
              {actionButtonLabel}
            </button>
          </div>
        </form>

        <div className="app-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Judge Type</th>
                <th>Judge Seat</th>
                {shouldShowLinkGeneration ? <th>Link Generation</th> : null}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {judges.length ? (
                judges.map((judge, index) => (
                  <tr
                    key={judge.id}
                    className={editingJudgeId === judge.id ? "bg-base-200/30" : ""}
                  >
                    <th>{index + 1}</th>
                    <td>{judge.fullName}</td>
                    <td>{judge.judgeType}</td>
                    <td>{judge.judgeNumber ?? "-"}</td>
                    {shouldShowLinkGeneration ? (
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => handleGenerateLink(judge)}
                          disabled={!eventId}
                          title={
                            eventId
                              ? "Generate judge scoring link"
                              : "Available after the event is created."
                          }
                        >
                          Generate
                        </button>
                      </td>
                    ) : null}
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleStartEditing(judge)}
                        disabled={isSavingJudge}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={emptyJudgeColSpan} className="text-base-content/60">
                    No judges added for this event yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {shouldShowLinkGeneration && isLinkModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeLinkModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-base-300 bg-base-100 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Judge Scoring Access</h3>
                <p className="text-sm text-base-content/70">
                  {activeJudgeName}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={closeLinkModal}
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
                onClick={() => setLinkModalTab("qr")}
              >
                QR
              </button>
              <button
                type="button"
                role="tab"
                className={`tab ${linkModalTab === "link" ? "tab-active" : ""}`}
                onClick={() => setLinkModalTab("link")}
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
                  <a
                    href={activeJudgeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-neutral btn-sm"
                  >
                    Open Link
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="form-control w-full">
                    <div className="label pb-1">
                      <span className="label-text font-semibold">
                        Scoring Link
                      </span>
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
                      onClick={handleCopyLink}
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
      ) : null}
    </>
  );
}

