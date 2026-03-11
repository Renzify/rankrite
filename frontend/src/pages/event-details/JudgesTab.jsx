import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";

const JUDGE_TYPE_OPTIONS = [
  "Difficulty Body",
  "Difficulty Apparatus",
  "Artistry",
  "Execution",
  "Time Judge",
  "Line Judge",
];

export default function JudgesTab() {
  const {
    eventDetails,
    eventTitle,
    selectedSport,
    judgeFullName,
    judgeType,
    judges,
    setJudgeFullName,
    setJudgeType,
    canSubmitJudge,
    handleJudgeSubmit,
  } = useOutletContext();

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalTab, setLinkModalTab] = useState("qr");
  const [activeJudgeName, setActiveJudgeName] = useState("");
  const [activeJudgeLink, setActiveJudgeLink] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const qrImageUrl = useMemo(() => {
    if (!activeJudgeLink) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(activeJudgeLink)}`;
  }, [activeJudgeLink]);

  const createJudgeScoringLink = (judge) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams();
    const eventId = eventDetails?.event?.id;

    if (eventId) params.set("eventId", eventId);
    if (eventTitle) params.set("eventTitle", eventTitle);
    if (selectedSport) params.set("sport", selectedSport);
    if (judge.id) params.set("judgeId", judge.id);
    if (judge.fullName) params.set("judgeName", judge.fullName);
    if (judge.judgeType) params.set("judgeType", judge.judgeType);

    const queryString = params.toString();
    return `${baseUrl}/judge-score${queryString ? `?${queryString}` : ""}`;
  };

  const handleGenerateLink = (judge) => {
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

  return (
    <>
      <div className="w-full space-y-5">
        <h2 className="text-xl font-semibold tracking-tight">Manage Judges</h2>
        <form
          className="grid gap-4 sm:grid-cols-[1.4fr_1fr_auto]"
          onSubmit={handleJudgeSubmit}
        >
          <label className="form-control w-full">
            <div className="label pb-1">
              <span className="label-text font-semibold">Full Name</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g. Maria Santos"
              value={judgeFullName}
              onChange={(event) => setJudgeFullName(event.target.value)}
            />
          </label>

          <label className="form-control w-full">
            <div className="label pb-1">
              <span className="label-text font-semibold">Judge Type</span>
            </div>
            <select
              className="select select-bordered w-full"
              value={judgeType}
              onChange={(event) => setJudgeType(event.target.value)}
            >
              <option value="">-- Select Judge Type --</option>
              {JUDGE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="btn btn-neutral w-full sm:w-auto"
              disabled={!canSubmitJudge}
            >
              Submit
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
                <th>Link Generation</th>
              </tr>
            </thead>
            <tbody>
              {judges.length ? (
                judges.map((judge, index) => (
                  <tr key={judge.id}>
                    <th>{index + 1}</th>
                    <td>{judge.fullName}</td>
                    <td>{judge.judgeType}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleGenerateLink(judge)}
                      >
                        Generate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-base-content/60">
                    No judges added for this event yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isLinkModalOpen ? (
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
                  <img
                    src={qrImageUrl}
                    alt={`QR code for ${activeJudgeName}`}
                    className="h-56 w-56 rounded-xl border border-base-300 bg-white p-2"
                  />
                  <p className="text-center text-xs text-base-content/60">
                    Scan this QR to open the judge scoring page.
                  </p>
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

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      className="btn btn-neutral btn-sm"
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
