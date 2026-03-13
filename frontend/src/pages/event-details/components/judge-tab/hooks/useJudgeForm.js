import { useState } from "react";
import { useJudgesTabContext } from "./useJudgesTabContext";

const JUDGE_TYPE_OPTIONS = [
  "Difficulty Body",
  "Difficulty Apparatus",
  "Artistry",
  "Execution",
  "Time Judge",
  "Line Judge",
];

function createLocalId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random()}`;
}

export function useJudgeForm() {
  const {
    isSavingJudge,
    judges,
    onCreateJudge,
    onDeleteJudge,
    onUpdateJudge,
    setJudges,
  } = useJudgesTabContext();

  const [formData, setFormData] = useState({
    fullName: "",
    judgeType: "",
    judgeNumber: "",
  });
  const [editingJudgeId, setEditingJudgeId] = useState(null);
  const [judgePendingDelete, setJudgePendingDelete] = useState(null);

  const canSubmitJudge = Boolean(
    formData.fullName.trim() &&
    formData.judgeType &&
    Number.parseInt(formData.judgeNumber, 10) > 0,
  );

  const resetForm = () => {
    setFormData({
      fullName: "",
      judgeType: "",
      judgeNumber: "",
    });
    setEditingJudgeId(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleJudgeSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmitJudge) return;

    const nextJudge = {
      fullName: formData.fullName.trim(),
      judgeType: formData.judgeType,
      judgeNumber: Number.parseInt(formData.judgeNumber, 10),
    };

    if (editingJudgeId) {
      if (onUpdateJudge) {
        try {
          await onUpdateJudge(editingJudgeId, nextJudge);
        } catch {
          return;
        }
      } else {
        setJudges((prev) =>
          prev.map((judge) =>
            judge.id === editingJudgeId ? { ...judge, ...nextJudge } : judge,
          ),
        );
      }
    } else if (onCreateJudge) {
      try {
        await onCreateJudge(nextJudge);
      } catch {
        return;
      }
    } else {
      setJudges((prev) => [
        ...prev,
        {
          id: createLocalId(),
          ...nextJudge,
        },
      ]);
    }

    resetForm();
  };

  const handleStartEditing = (judge) => {
    setEditingJudgeId(judge.id);
    setFormData({
      fullName: judge.fullName ?? "",
      judgeType: judge.judgeType ?? "",
      judgeNumber:
        judge.judgeNumber === null || judge.judgeNumber === undefined
          ? ""
          : String(judge.judgeNumber),
    });
  };

  const handleCancelEditing = () => {
    resetForm();
  };

  const handleOpenDeleteModal = (judge) => {
    if (!judge?.id || isSavingJudge) return;
    setJudgePendingDelete(judge);
  };

  const handleCloseDeleteModal = () => {
    if (isSavingJudge) return;
    setJudgePendingDelete(null);
  };

  const handleDeleteJudge = async () => {
    const judgeId = judgePendingDelete?.id;
    if (!judgeId) return;

    if (editingJudgeId === judgeId) {
      resetForm();
    }

    if (onDeleteJudge) {
      try {
        await onDeleteJudge(judgeId);
        setJudgePendingDelete(null);
      } catch {
        return;
      }
    } else {
      setJudges((prev) => prev.filter((judge) => judge.id !== judgeId));
      setJudgePendingDelete(null);
    }
  };

  const actionButtonLabel = editingJudgeId
    ? isSavingJudge
      ? "Saving..."
      : "Save Changes"
    : isSavingJudge
      ? "Submitting..."
      : "Submit";

  return {
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
  };
}
