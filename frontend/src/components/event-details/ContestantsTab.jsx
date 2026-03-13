import { useState } from "react";
import { useOutletContext } from "react-router";
import {
  CONTESTANT_GENDER_OPTIONS,
  getContestantDelegation,
} from "../../lib/contestantCsv";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import { useContestantsTabHandlers } from "../../hooks/useContestantsTabHandlers";
import { useTemplateStore } from "../../stores/templateStore";

export default function ContestantsTab() {
  const outletContext = useOutletContext() ?? {};
  const storeContestants = useTemplateStore((state) => state.contestants);
  const storeSetContestants = useTemplateStore((state) => state.setContestants);

  const contestants = outletContext.contestants ?? storeContestants;
  const setContestants = outletContext.setContestants ?? storeSetContestants;
  const onCreateContestant = outletContext.onCreateContestant;
  const onUpdateContestant = outletContext.onUpdateContestant;
  const onDeleteContestant = outletContext.onDeleteContestant;
  const onImportContestants = outletContext.onImportContestants;
  const isSavingContestant = outletContext.isSavingContestant ?? false;
  const [contestantPendingDelete, setContestantPendingDelete] = useState(null);

  const {
    fileInputRef,
    formData,
    editingContestantId,
    importMessage,
    importMessageTone,
    isImportingCsv,
    submitButtonLabel,
    handleInputChange,
    handleContestantSubmit,
    handleStartEditing,
    handleCancelEditing,
    handleImportClick,
    handleCsvImport,
    handleCsvExport,
    handleCsvTemplateDownload,
  } = useContestantsTabHandlers({
    contestants,
    setContestants,
    onCreateContestant,
    onUpdateContestant,
    onImportContestants,
  });

  const handleOpenDeleteModal = (contestant) => {
    if (!contestant?.id || isSavingContestant) return;
    setContestantPendingDelete(contestant);
  };

  const handleCloseDeleteModal = () => {
    if (isSavingContestant) return;
    setContestantPendingDelete(null);
  };

  const handleDeleteContestant = async () => {
    const contestantId = contestantPendingDelete?.id;
    if (!contestantId) return;

    if (editingContestantId === contestantId) {
      handleCancelEditing();
    }

    if (onDeleteContestant) {
      try {
        await onDeleteContestant(contestantId);
        setContestantPendingDelete(null);
      } catch {
        return;
      }
    } else {
      setContestants((prev) =>
        prev.filter((contestant) => contestant.id !== contestantId),
      );
      setContestantPendingDelete(null);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              Manage Contestants
            </h2>
            <div
              className="tooltip tooltip-warning tooltip-bottom z-[100] mt-1 flex h-[25px] w-[25px] cursor-help items-center justify-center rounded-full border-2 border-warning bg-transparent text-sm font-medium text-warning transition-all duration-200 hover:bg-warning hover:text-warning-content"
              data-tip="Contestants Tab: Manage the list of event contestants. It supports contestant entry, bulk import, and list export."
            >
              ?
            </div>
          </div>
          {editingContestantId ? (
            <span className="badge badge-outline badge-lg">
              Editing Contestant
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleImportClick}
            disabled={isSavingContestant || isImportingCsv}
          >
            {isImportingCsv ? "Importing..." : "Import CSV"}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleCsvExport}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-neutral btn-sm"
            onClick={handleCsvTemplateDownload}
          >
            Download Template
          </button>
        </div>
      </div>

      <form
        className="grid gap-4 sm:grid-cols-[1.4fr_1fr_0.8fr_auto]"
        onSubmit={handleContestantSubmit}
      >
        <label className="form-control w-full">
          <div className="label pb-1">
            <span className="label-text font-semibold">Full Name</span>
          </div>
          <input
            type="text"
            name="fullName"
            className="input input-bordered w-full"
            placeholder="e.g. Alex Cruz"
            value={formData.fullName}
            onChange={handleInputChange}
          />
        </label>

        <label className="form-control w-full">
          <div className="label pb-1">
            <span className="label-text font-semibold">Delegation</span>
          </div>
          <input
            type="text"
            name="delegation"
            className="input input-bordered w-full"
            placeholder="Team or delegation"
            value={formData.delegation}
            onChange={handleInputChange}
          />
        </label>

        <label className="form-control w-full">
          <div className="label pb-1">
            <span className="label-text font-semibold">Gender</span>
          </div>
          <select
            name="gender"
            className="select select-bordered w-full"
            value={formData.gender}
            onChange={handleInputChange}
          >
            <option value="">-- Select Gender --</option>
            {CONTESTANT_GENDER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2">
          {editingContestantId ? (
            <button
              type="button"
              className="btn btn-outline w-full sm:w-auto"
              onClick={handleCancelEditing}
              disabled={isSavingContestant}
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            className="btn btn-neutral w-full sm:w-auto"
            disabled={!formData.fullName.trim() || isSavingContestant}
          >
            {isSavingContestant
              ? editingContestantId
                ? "Saving..."
                : "Submitting..."
              : submitButtonLabel}
          </button>
        </div>
      </form>

      {importMessage ? (
        <div
          className={`alert ${
            importMessageTone === "error"
              ? "alert-error"
              : importMessageTone === "success"
                ? "alert-success"
                : "border border-base-300 bg-base-200/60 text-base-content"
          }`}
        >
          <span>{importMessage}</span>
        </div>
      ) : null}

      <div className="app-table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Contestant Name</th>
              <th>Delegation</th>
              <th>Gender</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contestants.length ? (
              contestants.map((contestant, index) => (
                <tr
                  key={contestant.id}
                  className={
                    editingContestantId === contestant.id ? "bg-base-200/30" : ""
                  }
                >
                  <td>
                    {index + 1}. {contestant.fullName}
                  </td>
                  <td>{getContestantDelegation(contestant) || "-"}</td>
                  <td>{contestant.gender || "-"}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleStartEditing(contestant)}
                        disabled={isSavingContestant}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => handleOpenDeleteModal(contestant)}
                        disabled={isSavingContestant}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-base-content/60">
                  No contestants added for this event yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(contestantPendingDelete)}
        title="Delete Contestant"
        name={contestantPendingDelete?.fullName ?? ""}
        descriptionLines={[
          "This will permanently remove the contestant from this event.",
          "The action cannot be undone.",
        ]}
        confirmLabel="Delete Contestant"
        isDeleting={isSavingContestant}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteContestant}
      />
    </div>
  );
}
