import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import ConfirmDeleteModal from "../../../../shared/components/ConfirmDeleteModal";
import JudgeLinkModal from "./components/JudgeLinkModal";
import SwitchContestantConfirmModal from "./components/SwitchContestantConfirmModal";
import { useJudgeForm } from "./hooks/useJudgeForm";
import { useJudgeLinkModal } from "./hooks/useJudgeLinkModal";
import { useJudgesTabContext } from "./hooks/useJudgesTabContext";

function formatContestantLabel(contestant) {
  if (!contestant) {
    return "No contestant selected";
  }

  const entryNo = Number.parseInt(String(contestant.entryNo ?? ""), 10);
  const entryLabel = Number.isFinite(entryNo) ? `#${entryNo}` : "#-";
  const fullName =
    contestant.fullName || contestant.name || "Unnamed contestant";
  const delegation = contestant.teamName || contestant.delegation || "";

  return delegation
    ? `${entryLabel} - ${fullName} (${delegation})`
    : `${entryLabel} - ${fullName}`;
}

export default function JudgesTab({ showLinkGeneration }) {
  const { activeContestantId, contestants, setActiveContestantId } =
    useJudgesTabContext();
  const {
    JUDGE_TYPE_OPTIONS,
    actionButtonLabel,
    canSubmitJudge,
    editingJudgeId,
    formData,
    handleCancelEditing,
    handleCloseDeleteModal,
    handleDeleteJudge,
    handleInputChange,
    handleJudgeSubmit,
    handleOpenDeleteModal,
    handleStartEditing,
    isSavingJudge,
    judgePendingDelete,
    judges,
  } = useJudgeForm();
  const {
    activeJudgeLink,
    activeJudgeName,
    closeLinkModal,
    copyMessage,
    eventId,
    handleCopyLink,
    handleGenerateLink,
    isLinkModalOpen,
    linkModalTab,
    setLinkModalTab,
    shouldShowLinkGeneration,
  } = useJudgeLinkModal(showLinkGeneration);

  const switchContestantModalRef = useRef(null);

  const sortedContestants = useMemo(
    () =>
      [...contestants].sort(
        (left, right) =>
          (left.entryNo ?? Number.MAX_SAFE_INTEGER) -
          (right.entryNo ?? Number.MAX_SAFE_INTEGER),
      ),
    [contestants],
  );

  const [selectedCandidateContestantId, setSelectedCandidateContestantId] =
    useState("");
  const pendingActiveContestantId =
    selectedCandidateContestantId || activeContestantId || "";

  const hasContestants = sortedContestants.length > 0;
  const activeContestant =
    sortedContestants.find(
      (contestant) => contestant.id === activeContestantId,
    ) ?? null;
  const pendingContestant =
    sortedContestants.find(
      (contestant) => contestant.id === pendingActiveContestantId,
    ) ?? null;

  const canSwitchActiveContestant = Boolean(
    pendingContestant && pendingContestant.id !== activeContestantId,
  );

  const handleSwitchRequest = () => {
    if (!pendingContestant || !canSwitchActiveContestant) {
      return;
    }

    switchContestantModalRef.current?.open({
      currentContestantLabel: activeContestant
        ? formatContestantLabel(activeContestant)
        : "No active contestant",
      nextContestantLabel: formatContestantLabel(pendingContestant),
      onConfirm: () => {
        setActiveContestantId(pendingContestant.id);
        setSelectedCandidateContestantId("");
        toast.success(
          `Active contestant switched to ${pendingContestant.fullName}.`,
        );
      },
    });
  };

  const emptyJudgeColSpan = shouldShowLinkGeneration ? 5 : 4;

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              Manage Judges
            </h2>
            <div
              className="tooltip tooltip-warning tooltip-bottom z-[100] flex h-[25px] w-[25px] cursor-help items-center justify-center rounded-full border-2 border-warning bg-transparent text-sm font-medium text-warning transition-all duration-200 hover:bg-warning hover:text-warning-content"
              data-tip="Judges Tab: Manage the event's judges and their scoring access. It supports judge assignment, role setup, and score page access."
            >
              ?
            </div>
          </div>
          {editingJudgeId ? (
            <span className="badge badge-outline badge-lg">Editing Judge</span>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <div>
          <h3 className="text-base font-semibold">Active Contestant Control</h3>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1.2fr_auto]">
          <div>
            <p className="text-sm font-semibold tracking-wide text-base-content/60">
              Current Active
            </p>
            <div className="mt-1 rounded-lg border border-base-300 bg-base-200 px-3 py-2 text-sm font-medium ">
              {activeContestant
                ? formatContestantLabel(activeContestant)
                : "No contestants available yet."}
            </div>
          </div>

          <label className="form-control w-full">
            <div className="label rounded-sm">
              <span className="label-text font-semibold">Switch To</span>
            </div>
            <select
              className="select select-bordered w-full"
              value={pendingActiveContestantId}
              onChange={(event) =>
                setSelectedCandidateContestantId(event.target.value)
              }
              disabled={!hasContestants || isSavingJudge}
            >
              <option value="">-- Select Contestant --</option>
              {sortedContestants.map((contestant) => (
                <option key={contestant.id} value={contestant.id}>
                  {formatContestantLabel(contestant)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              className="btn btn-neutral w-full md:w-auto"
              onClick={handleSwitchRequest}
              disabled={!canSwitchActiveContestant || isSavingJudge}
            >
              Switch Active Contestant
            </button>
          </div>
        </div>
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
                  className={
                    editingJudgeId === judge.id ? "bg-base-200/30" : ""
                  }
                >
                  <td>
                    {index + 1}. {judge.fullName}
                  </td>
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
                        Generate Link
                      </button>
                    </td>
                  ) : null}
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleStartEditing(judge)}
                        disabled={isSavingJudge}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => handleOpenDeleteModal(judge)}
                        disabled={isSavingJudge}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={emptyJudgeColSpan}
                  className="text-base-content/60"
                >
                  No judges added for this event yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(judgePendingDelete)}
        title="Delete Judge"
        name={judgePendingDelete?.fullName ?? ""}
        descriptionLines={[
          "This will permanently remove the judge from this event.",
          "The action cannot be undone.",
        ]}
        confirmLabel="Delete Judge"
        isDeleting={isSavingJudge}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteJudge}
      />

      <JudgeLinkModal
        activeJudgeLink={activeJudgeLink}
        activeJudgeName={activeJudgeName}
        copyMessage={copyMessage}
        isOpen={shouldShowLinkGeneration && isLinkModalOpen}
        linkModalTab={linkModalTab}
        onClose={closeLinkModal}
        onCopyLink={handleCopyLink}
        onTabChange={setLinkModalTab}
      />

      <SwitchContestantConfirmModal ref={switchContestantModalRef} />
    </div>
  );
}
