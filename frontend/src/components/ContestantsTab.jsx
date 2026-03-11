import { useRef, useState } from "react";
import { useOutletContext } from "react-router";

const GENDER_OPTIONS = ["Male", "Female"];

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function escapeCsvValue(value) {
  const text = `${value ?? ""}`;
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random()}`;
}

function normalizeContestant(contestant, index = 0) {
  const delegation = contestant.delegation ?? contestant.teamName ?? "";
  const teamName = contestant.teamName ?? contestant.delegation ?? "";

  return {
    ...contestant,
    id: contestant.id ?? createId(),
    fullName: contestant.fullName?.trim() ?? "",
    delegation,
    teamName,
    gender: contestant.gender ?? "",
    entryNo: contestant.entryNo ?? index + 1,
  };
}

export default function ContestantsTab({
  useRouteContext = false,
  contestants: contestantsProp = [],
  onAddContestant,
  onContestantsChange,
}) {
  const outletContext = useOutletContext();
  const resolvedContext = useRouteContext ? (outletContext ?? {}) : {};
  const contestants = resolvedContext.contestants ?? contestantsProp;
  const handleContestantsChange =
    resolvedContext.setContestants ?? onContestantsChange;
  const handleAddContestant = resolvedContext.onAddContestant ?? onAddContestant;

  const [formData, setFormData] = useState({
    fullName: "",
    teamName: "",
    gender: "",
  });
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef(null);

  const canSubmitContestant = Boolean(formData.fullName.trim());

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const appendContestants = (nextContestants) => {
    if (typeof handleContestantsChange !== "function") {
      return false;
    }

    handleContestantsChange((previousContestants = []) => {
      const safePreviousContestants = Array.isArray(previousContestants)
        ? previousContestants
        : [];

      return [
        ...safePreviousContestants,
        ...nextContestants.map((contestant, index) =>
          normalizeContestant(
            contestant,
            safePreviousContestants.length + index,
          ),
        ),
      ];
    });

    return true;
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();

    if (!canSubmitContestant) {
      return;
    }

    const nextContestant = normalizeContestant(
      {
        fullName: formData.fullName,
        teamName: formData.teamName,
        delegation: formData.teamName,
        gender: formData.gender,
      },
      contestants.length,
    );

    if (typeof handleAddContestant === "function") {
      handleAddContestant(nextContestant);
    } else {
      appendContestants([nextContestant]);
    }

    setFormData({
      fullName: "",
      teamName: "",
      gender: "",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCsvImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const csvText = await file.text();
      const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        setImportMessage("CSV must include headers and at least one row.");
        return;
      }

      const headers = parseCsvLine(lines[0]).map(normalizeHeader);
      const fullNameIndex = headers.findIndex((header) =>
        ["full_name", "fullname", "name", "contestant"].includes(header),
      );
      const delegationIndex = headers.findIndex((header) =>
        ["delegation", "team", "team_name"].includes(header),
      );
      const genderIndex = headers.findIndex((header) =>
        ["gender", "sex"].includes(header),
      );

      if (fullNameIndex === -1) {
        setImportMessage("CSV headers must include a name column.");
        return;
      }

      const importedRows = lines
        .slice(1)
        .map((line) => parseCsvLine(line))
        .map((columns) => ({
          fullName: columns[fullNameIndex] ?? "",
          teamName: delegationIndex === -1 ? "" : (columns[delegationIndex] ?? ""),
          delegation:
            delegationIndex === -1 ? "" : (columns[delegationIndex] ?? ""),
          gender: genderIndex === -1 ? "" : (columns[genderIndex] ?? ""),
        }))
        .filter((row) => row.fullName.trim());

      if (!importedRows.length) {
        setImportMessage("No valid contestants found in the CSV file.");
        return;
      }

      if (!appendContestants(importedRows)) {
        setImportMessage("Unable to import contestants right now.");
        return;
      }

      setImportMessage(`Imported ${importedRows.length} contestant(s).`);
    } catch {
      setImportMessage("Failed to read CSV file.");
    } finally {
      event.target.value = "";
    }
  };

  const handleCsvExport = () => {
    if (!contestants.length) {
      setImportMessage("No contestants to export.");
      return;
    }

    const header = ["full_name", "delegation", "gender"];
    const rows = contestants.map((contestant) => [
      escapeCsvValue(contestant.fullName),
      escapeCsvValue(contestant.delegation ?? contestant.teamName),
      escapeCsvValue(contestant.gender),
    ]);

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "contestants.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

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
            className="btn btn-neutral btn-sm"
            onClick={handleCsvExport}
          >
            Export CSV
          </button>
        </div>
      </div>

      <form
        className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(180px,0.7fr)_auto]"
        onSubmit={handleManualSubmit}
      >
        <label className="form-control w-full">
          <div className="label pb-1">
            <span className="label-text font-semibold">Full Name</span>
          </div>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Enter contestant's name"
            className="input input-bordered w-full"
          />
        </label>

        <label className="form-control w-full">
          <div className="label pb-1">
            <span className="label-text font-semibold">Delegation / Team</span>
          </div>
          <input
            type="text"
            name="teamName"
            value={formData.teamName}
            onChange={handleInputChange}
            placeholder="Enter delegation or team"
            className="input input-bordered w-full"
          />
        </label>

        <label className="form-control w-full">
          <div className="label pb-1">
            <span className="label-text font-semibold">Gender</span>
          </div>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="select select-bordered w-full"
          >
            <option value="">-- Select Gender --</option>
            {GENDER_OPTIONS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="btn btn-neutral w-full sm:w-auto"
            disabled={!canSubmitContestant}
          >
            Submit
          </button>
        </div>
      </form>

      {importMessage ? (
        <div className="alert border border-base-300 bg-base-200/60 text-base-content">
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
                  <td>{contestant.delegation ?? contestant.teamName ?? "-"}</td>
                  <td>{contestant.gender || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-base-content/60">
                  No contestants added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
