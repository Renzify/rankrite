import { useRef, useState } from "react";
import {
  buildContestantCsv,
  buildContestantCsvTemplate,
  CONTESTANT_GENDER_OPTIONS,
  createContestantRecord,
  normalizeContestantGender,
  parseContestantCsv,
  validateContestantCsvFile,
} from "../lib/contestantCsv";

const EMPTY_FORM_DATA = {
  fullName: "",
  delegation: "",
  gender: "",
};

const CSV_ERROR_MESSAGES = {
  CSV_INVALID_FILE_TYPE: "Only CSV files are allowed.",
  CSV_EMPTY_FILE: "The selected CSV file is empty.",
  CSV_MISSING_ROWS: "CSV must include headers and at least one row.",
  CSV_MISSING_NAME_COLUMN: "CSV headers must include a name column.",
  CSV_NO_VALID_CONTESTANTS: "No valid contestants found in the CSV file.",
};

function downloadCsvFile(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function useContestantsTabHandlers({
  contestants,
  setContestants,
  onCreateContestant,
  onImportContestants,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);
  const [importMessage, setImportMessage] = useState("");
  const [importMessageTone, setImportMessageTone] = useState("info");
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContestantSubmit = async (event) => {
    event.preventDefault();
    if (!formData.fullName.trim()) return;

    const normalizedGender = normalizeContestantGender(formData.gender);

    if (formData.gender && normalizedGender === null) {
      setImportMessage(
        `Gender must be ${CONTESTANT_GENDER_OPTIONS.join(" or ")}.`,
      );
      setImportMessageTone("error");
      return;
    }

    const nextContestant = createContestantRecord({
      ...formData,
      gender: normalizedGender ?? "",
    });

    if (onCreateContestant) {
      try {
        await onCreateContestant(nextContestant);
      } catch {
        return;
      }
    } else {
      setContestants((prev) => [...prev, nextContestant]);
    }

    setFormData(EMPTY_FORM_DATA);
    setImportMessage("");
    setImportMessageTone("info");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCsvImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingCsv(true);
      validateContestantCsvFile(file);
      const importedRows = await parseContestantCsv(file);

      if (onImportContestants) {
        const createdContestants = await onImportContestants(importedRows);
        setImportMessage(`Imported ${createdContestants.length} contestant(s).`);
      } else {
        setContestants(importedRows);
        setImportMessage(`Imported ${importedRows.length} contestant(s).`);
      }

      setImportMessageTone("success");
    } catch (error) {
      if (error instanceof Error && error.message === "CSV_INVALID_GENDER_VALUES") {
        const rowNumbers = Array.isArray(error.rowNumbers)
          ? error.rowNumbers.join(", ")
          : "";

        setImportMessage(
          `Invalid gender value in row(s) ${rowNumbers}. Use ${CONTESTANT_GENDER_OPTIONS.join(" or ")} only.`,
        );
        setImportMessageTone("error");
        return;
      }

      if (error instanceof Error && CSV_ERROR_MESSAGES[error.message]) {
        setImportMessage(CSV_ERROR_MESSAGES[error.message]);
        setImportMessageTone("error");
        return;
      }

      const responseMessage = error?.response?.data?.message;
      setImportMessage(
        typeof responseMessage === "string" && responseMessage.trim()
          ? responseMessage
          : "Failed to import contestants from CSV.",
      );
      setImportMessageTone("error");
    } finally {
      setIsImportingCsv(false);
      event.target.value = "";
    }
  };

  const handleCsvExport = () => {
    if (!contestants.length) {
      setImportMessage("No contestants to export.");
      setImportMessageTone("error");
      return;
    }

    const csv = buildContestantCsv(contestants);
    downloadCsvFile(csv, "contestants.csv");
    setImportMessage("");
    setImportMessageTone("info");
  };

  const handleCsvTemplateDownload = () => {
    const csv = buildContestantCsvTemplate();
    downloadCsvFile(csv, "contestants-template.csv");
    setImportMessage("");
    setImportMessageTone("info");
  };

  return {
    fileInputRef,
    formData,
    importMessage,
    importMessageTone,
    isImportingCsv,
    handleInputChange,
    handleContestantSubmit,
    handleImportClick,
    handleCsvImport,
    handleCsvExport,
    handleCsvTemplateDownload,
  };
}
