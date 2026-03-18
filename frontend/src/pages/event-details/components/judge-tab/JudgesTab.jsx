import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import ConfirmDeleteModal from "../../../../shared/components/ConfirmDeleteModal";
import InfoTooltip from "../../../../shared/components/InfoTooltip";
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

export default function JudgesTab({
  showLinkGeneration,
  showActiveContestantControl = true,
}) {
  const {
    activeContestantId,
    canManageSetup,
    contestants,
    currentEventStatus,
    isSwitchingActiveContestant,
    onSetActiveContestant,
    setActiveContestantId,
  } = useJudgesTabContext();
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
    suggestedJudgeNumber,
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
    canGenerateJudgeLinks,
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
  const canControlActiveContestant = currentEventStatus === "live";

  const canSwitchActiveContestant = Boolean(
    canControlActiveContestant &&
      pendingContestant &&
      pendingContestant.id !== activeContestantId,
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
      onConfirm: async () => {
        if (onSetActiveContestant) {
          await onSetActiveContestant(pendingContestant.id);
        } else {
          setActiveContestantId(pendingContestant.id);
        }

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
            <InfoTooltip content="Judges Tab: Manage the event's judges and their scoring access. It supports judge assignment, role setup, and score page access." />
          </div>
          {editingJudgeId ? (
            <span className="badge badge-outline badge-lg">Editing Judge</span>
          ) : null}
        </div>
      </div>

      {!canManageSetup ? (
        <div className="alert border border-base-300 bg-base-200/60 text-base-content">
          <span>
            Setup changes are only available while the event is Draft or To Be Held.
          </span>
        </div>
      ) : null}

      {showActiveContestantControl ? (
        <div className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div>
            <h3 className="text-base font-semibold">
              Active Contestant Control
            </h3>
            <p className="text-sm text-base-content/70">
              Judges cannot pick contestants. Admin controls who is currently
              active.
            </p>
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
              <div
                title={
                  !canControlActiveContestant
                    ? "Event must be live first."
                    : undefined
                }
              >
                <select
                  className="select select-bordered w-full"
                  value={pendingActiveContestantId}
                  onChange={(event) =>
                    setSelectedCandidateContestantId(event.target.value)
                  }
                  disabled={
                    !canControlActiveContestant ||
                    !hasContestants ||
                    isSavingJudge ||
                    isSwitchingActiveContestant
                  }
                >
                  <option value="">-- Select Contestant --</option>
                  {sortedContestants.map((contestant) => (
                    <option key={contestant.id} value={contestant.id}>
                      {formatContestantLabel(contestant)}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="flex items-end">
              <div
                title={
                  !canControlActiveContestant
                    ? "Event must be live first."
                    : undefined
                }
              >
                <button
                  type="button"
                  className="btn btn-neutral w-full md:w-auto"
                  onClick={handleSwitchRequest}
                  disabled={
                    !canSwitchActiveContestant ||
                    isSavingJudge ||
                    isSwitchingActiveContestant
                  }
                >
                  {isSwitchingActiveContestant
                    ? "Switching..."
                    : "Switch Active Contestant"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <form
        className="grid gap-4 lg:grid-cols-[1.4fr_1fr_0.8fr_auto]"
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
            disabled={!canManageSetup || isSavingJudge}
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
            disabled={!canManageSetup || isSavingJudge}
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
            placeholder={String(suggestedJudgeNumber)}
            value={formData.judgeNumber}
            onChange={handleInputChange}
            disabled={!canManageSetup || isSavingJudge}
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
            disabled={!canManageSetup || !canSubmitJudge || isSavingJudge}
          >
            {actionButtonLabel}
          </button>
        </div>
      </form>

      <div className="app-table-wrap">
        <table className="table min-w-[780px]">
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
                      <div
                        className="inline-block"
                        title={
                          !eventId
                            ? "Available after the event is created."
                            : !canGenerateJudgeLinks
                              ? "Event must be live first."
                              : undefined
                        }
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => handleGenerateLink(judge)}
                          disabled={!eventId || !canGenerateJudgeLinks}
                        >
                          Generate Link
                        </button>
                      </div>
                    </td>
                  ) : null}
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleStartEditing(judge)}
                        disabled={!canManageSetup || isSavingJudge}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => handleOpenDeleteModal(judge)}
                        disabled={!canManageSetup || isSavingJudge}
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

      {showActiveContestantControl ? (
        <SwitchContestantConfirmModal ref={switchContestantModalRef} />
      ) : null}
    </div>
  );
}
