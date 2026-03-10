import { useRef, useState } from "react";
import { useOutletContext } from "react-router";

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

export default function ContestantTab() {
  const { contestants, setContestants } = useOutletContext();
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef(null);

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

      if (fullNameIndex === -1 || delegationIndex === -1) {
        setImportMessage(
          "CSV headers must include a name column and a delegation column.",
        );
        return;
      }

      const importedRows = lines
        .slice(1)
        .map((line) => parseCsvLine(line))
        .map((columns) => ({
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}_${Math.random()}`,
          fullName: columns[fullNameIndex] ?? "",
          delegation: columns[delegationIndex] ?? "",
        }))
        .filter((row) => row.fullName.trim() && row.delegation.trim());

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

    const header = ["full_name", "delegation"];
    const rows = contestants.map((contestant) => [
      escapeCsvValue(contestant.fullName),
      escapeCsvValue(contestant.delegation),
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
        <h2 className="text-lg font-semibold">Contestants</h2>

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
      {importMessage ? (
        <div className="alert border border-base-300 bg-base-200/60 text-base-content">
          <span>{importMessage}</span>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Contestant Name</th>
              <th>Delegation</th>
            </tr>
          </thead>
          <tbody>
            {contestants.length ? (
              contestants.map((contestant, index) => (
                <tr key={contestant.id}>
                  <th>{index + 1}</th>
                  <td>{contestant.fullName}</td>
                  <td>{contestant.delegation}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-base-content/60">
                  No contestants imported yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
