import { useOutletContext } from "react-router";
import {
  CONTESTANT_GENDER_OPTIONS,
  getContestantDelegation,
} from "../../lib/contestantCsv";
import { useTemplateStore } from "../../stores/templateStore";
import { useContestantsTabHandlers } from "../../hooks/useContestantsTabHandlers";

export default function ContestantsTab() {
  const outletContext = useOutletContext() ?? {};
  const storeContestants = useTemplateStore((state) => state.contestants);
  const storeSetContestants = useTemplateStore((state) => state.setContestants);

  const contestants = outletContext.contestants ?? storeContestants;
  const setContestants = outletContext.setContestants ?? storeSetContestants;
  const onCreateContestant = outletContext.onCreateContestant;
  const isSavingContestant = outletContext.isSavingContestant ?? false;

  const {
    fileInputRef,
    formData,
    importMessage,
    importMessageTone,
    handleInputChange,
    handleContestantSubmit,
    handleImportClick,
    handleCsvImport,
    handleCsvExport,
    handleCsvTemplateDownload,
  } = useContestantsTabHandlers({
    contestants,
    setContestants,
    onCreateContestant,
  });

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Contestants</h2>

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
          >
            Import CSV
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

        <div className="flex items-end">
          <button
            type="submit"
            className="btn btn-neutral w-full sm:w-auto"
            disabled={!formData.fullName.trim() || isSavingContestant}
          >
            {isSavingContestant ? "Submitting..." : "Submit"}
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
              <th>#</th>
              <th>Contestant Name</th>
              <th>Delegation</th>
              <th>Gender</th>
            </tr>
          </thead>
          <tbody>
            {contestants.length ? (
              contestants.map((contestant, index) => (
                <tr key={contestant.id}>
                  <th>{index + 1}</th>
                  <td>{contestant.fullName}</td>
                  <td>{getContestantDelegation(contestant) || "-"}</td>
                  <td>{contestant.gender || "-"}</td>
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
    </div>
  );
}
