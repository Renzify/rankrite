import Papa from "papaparse";

export const CONTESTANT_GENDER_OPTIONS = ["Male", "Female"];

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function createCsvError(message, details = {}) {
  const error = new Error(message);
  Object.assign(error, details);
  return error;
}

export function createContestantId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random()}`;
}

export function getContestantDelegation(contestant) {
  return contestant.delegation ?? contestant.teamName ?? "";
}

export function normalizeContestantGender(value) {
  const normalizedValue = String(value ?? "").trim().toLowerCase();

  if (!normalizedValue) return "";
  if (normalizedValue === "male" || normalizedValue === "m") return "Male";
  if (normalizedValue === "female" || normalizedValue === "f") return "Female";

  return null;
}

export function createContestantRecord({ fullName, delegation, gender }) {
  const trimmedDelegation = String(delegation ?? "").trim();
  const normalizedGender = normalizeContestantGender(gender);

  return {
    id: createContestantId(),
    fullName: String(fullName ?? "").trim(),
    delegation: trimmedDelegation,
    teamName: trimmedDelegation,
    gender: normalizedGender ?? "",
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

  const parsedRows = rows
    .slice(1)
    .filter((columns) => Array.isArray(columns))
    .map((columns, index) => {
      const rawGender =
        genderIndex === -1 ? "" : String(columns[genderIndex] ?? "");
      const normalizedGender = normalizeContestantGender(rawGender);

      return {
        rowNumber: index + 2,
        fullName: String(columns[fullNameIndex] ?? ""),
        delegation:
          delegationIndex === -1
            ? ""
            : String(columns[delegationIndex] ?? ""),
        gender: normalizedGender,
        hasInvalidGender: rawGender.trim() && normalizedGender === null,
      };
    })
    .filter((row) => row.fullName.trim());

  const invalidGenderRows = parsedRows
    .filter((row) => row.hasInvalidGender)
    .map((row) => row.rowNumber);

  if (invalidGenderRows.length) {
    throw createCsvError("CSV_INVALID_GENDER_VALUES", {
      rowNumbers: invalidGenderRows,
    });
  }

  const contestants = parsedRows.map((row) =>
    createContestantRecord({
      fullName: row.fullName,
      delegation: row.delegation,
      gender: row.gender ?? "",
    }),
  );

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

export function buildContestantCsvTemplate() {
  return Papa.unparse({
    fields: ["Full Name", "Delegation", "Gender"],
    data: [],
  });
}
