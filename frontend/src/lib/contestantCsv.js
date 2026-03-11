import Papa from "papaparse";

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function createContestantId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random()}`;
}

export function getContestantDelegation(contestant) {
  return contestant.delegation ?? contestant.teamName ?? "";
}

export function createContestantRecord({ fullName, delegation, gender }) {
  const trimmedDelegation = delegation.trim();

  return {
    id: createContestantId(),
    fullName: fullName.trim(),
    delegation: trimmedDelegation,
    teamName: trimmedDelegation,
    gender,
  };
}

export async function parseContestantCsv(file) {
  const parseResult = await new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: "greedy",
      complete: resolve,
      error: reject,
    });
  });

  const rows = Array.isArray(parseResult?.data) ? parseResult.data : [];

  if (rows.length < 2) {
    throw new Error("CSV_MISSING_ROWS");
  }

  const headerRow = Array.isArray(rows[0]) ? rows[0] : [];
  const headers = headerRow.map((header) =>
    normalizeHeader(String(header ?? "")),
  );
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
    throw new Error("CSV_MISSING_NAME_COLUMN");
  }

  const contestants = rows
    .slice(1)
    .filter((columns) => Array.isArray(columns))
    .map((columns) =>
      createContestantRecord({
        fullName: String(columns[fullNameIndex] ?? ""),
        delegation:
          delegationIndex === -1
            ? ""
            : String(columns[delegationIndex] ?? ""),
        gender:
          genderIndex === -1 ? "" : String(columns[genderIndex] ?? "").trim(),
      }),
    )
    .filter((row) => row.fullName);

  if (!contestants.length) {
    throw new Error("CSV_NO_VALID_CONTESTANTS");
  }

  return contestants;
}

export function buildContestantCsv(contestants) {
  return Papa.unparse({
    fields: ["full_name", "delegation", "gender"],
    data: contestants.map((contestant) => ({
      full_name: contestant.fullName ?? "",
      delegation: getContestantDelegation(contestant),
      gender: contestant.gender ?? "",
    })),
  });
}
