import { useRef, useState } from "react";
import {
  buildContestantCsv,
  createContestantRecord,
  parseContestantCsv,
} from "../lib/contestantCsv";

const EMPTY_FORM_DATA = {
  fullName: "",
  delegation: "",
  gender: "",
};

const CSV_ERROR_MESSAGES = {
  CSV_MISSING_ROWS: "CSV must include headers and at least one row.",
  CSV_MISSING_NAME_COLUMN: "CSV headers must include a name column.",
  CSV_NO_VALID_CONTESTANTS: "No valid contestants found in the CSV file.",
};

export function useContestantsTabHandlers({ contestants, setContestants }) {
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);
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

    const nextContestant = createContestantRecord(formData);

    setContestants((prev) => [...prev, nextContestant]);
    setFormData(EMPTY_FORM_DATA);
    setImportMessage("");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCsvImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedRows = await parseContestantCsv(file);
      setContestants(importedRows);
      setImportMessage(`Imported ${importedRows.length} contestant(s).`);
    } catch (error) {
      if (error instanceof Error && CSV_ERROR_MESSAGES[error.message]) {
        setImportMessage(CSV_ERROR_MESSAGES[error.message]);
        return;
      }

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

    const csv = buildContestantCsv(contestants);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "contestants.csv";
    link.click();

    URL.revokeObjectURL(url);
    setImportMessage("");
  };

  return {
    fileInputRef,
    formData,
    importMessage,
    handleInputChange,
    handleContestantSubmit,
    handleImportClick,
    handleCsvImport,
    handleCsvExport,
  };
}
