import { useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { useTemplateStore } from "../stores/templateStore";

const GENDER_OPTIONS = ["Male", "Female"];

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
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

function createLocalId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random()}`;
}

function getDelegation(contestant) {
  return contestant.delegation ?? contestant.teamName ?? "";
}

export default function ContestantsTab() {
  const outletContext = useOutletContext() ?? {};
  const storeContestants = useTemplateStore((state) => state.contestants);
  const storeSetContestants = useTemplateStore((state) => state.setContestants);

  const contestants = outletContext.contestants ?? storeContestants;
  const setContestants = outletContext.setContestants ?? storeSetContestants;

  const [formData, setFormData] = useState({
    fullName: "",
    delegation: "",
    gender: "",
  });
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContestantSubmit = (event) => {
    event.preventDefault();
    if (!formData.fullName.trim()) return;

    const delegation = formData.delegation.trim();
    const nextContestant = {
      id: createLocalId(),
      fullName: formData.fullName.trim(),
      delegation,
      teamName: delegation,
      gender: formData.gender,
    };

    setContestants((prev) => [...prev, nextContestant]);
    setFormData({
      fullName: "",
      delegation: "",
      gender: "",
    });
    setImportMessage("");
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
        .map((columns) => {
          const delegation =
            delegationIndex === -1 ? "" : (columns[delegationIndex] ?? "").trim();

          return {
            id: createLocalId(),
            fullName: (columns[fullNameIndex] ?? "").trim(),
            delegation,
            teamName: delegation,
            gender:
              genderIndex === -1 ? "" : (columns[genderIndex] ?? "").trim(),
          };
        })
        .filter((row) => row.fullName);

      if (!importedRows.length) {
        setImportMessage("No valid contestants found in the CSV file.");
        return;
      }

      setContestants(importedRows);
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
      escapeCsvValue(getDelegation(contestant)),
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
    setImportMessage("");
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
            {GENDER_OPTIONS.map((option) => (
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
            disabled={!formData.fullName.trim()}
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
                  <td>{getDelegation(contestant) || "-"}</td>
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
