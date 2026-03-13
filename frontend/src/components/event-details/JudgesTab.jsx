import ConfirmDeleteModal from "../ConfirmDeleteModal";
import JudgeLinkModal from "./JudgeLinkModal";
import { useJudgeForm } from "../../hooks/useJudgeForm";
import { useJudgeLinkModal } from "../../hooks/useJudgeLinkModal";

export default function JudgesTab({ showLinkGeneration }) {
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

  const emptyJudgeColSpan = shouldShowLinkGeneration ? 6 : 5;

  return (
    <>
      <div className="w-full space-y-5">

        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Manage Judges
          </h2>
          <div
            className="tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200"
            data-tip="Judges Tab: Manage the event’s judges and their scoring access. It supports judge assignment, role setup, and score page access."
          >
            ?

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              Manage Judges
            </h2>
            {editingJudgeId ? (
              <span className="badge badge-outline badge-lg">
                Editing Judge
              </span>
            ) : null}

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
                      {index + 1 + "."} {judge.fullName}
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
    </>
  );
}
