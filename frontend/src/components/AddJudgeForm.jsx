import { useState } from "react";
import { useTemplateStore } from "../stores/templateStore";
import toast from "react-hot-toast";

const JUDGE_TYPES = [
  { value: "difficulty_body", label: "Difficulty Body" },
  { value: "difficulty_apparatus", label: "Difficulty Apparatus" },
  { value: "artistry", label: "Artistry" },
  { value: "execution", label: "Execution" },
  { value: "time_judge", label: "Time Judge" },
  { value: "line_judge", label: "Line Judge" },
];

function AddJudgeForm() {
  const { judges, addJudge, removeJudge } = useTemplateStore();

  const [formData, setFormData] = useState({
    fullName: "",
    judgeType: "",
    judgeNumber: 1,
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddJudge = () => {
    if (!formData.fullName.trim()) {
      toast.error("Please enter judge's full name");
      return;
    }
    if (!formData.judgeType) {
      toast.error("Please select a judge type");
      return;
    }

    addJudge({
      id: crypto.randomUUID(),
      fullName: formData.fullName.trim(),
      judgeType: formData.judgeType,
      judgeTypeLabel:
        JUDGE_TYPES.find((t) => t.value === formData.judgeType)?.label ||
        formData.judgeType,
      judgeNumber: formData.judgeNumber,
    });

    toast.success("Judge added successfully");
    setFormData({
      fullName: "",
      judgeType: "",
      judgeNumber: 1,
    });
  };

  const handleRemoveJudge = (id) => {
    removeJudge(id);
    toast.success("Judge removed");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body gap-5">
          <h2 className="card-title">Add Judges</h2>
          <p className="text-sm text-base-content/70">
            Add judges to the event. You can assign different judge types and
            numbers.
          </p>

          <div className="divider my-0">New Judge</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Full Name</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
              />
            </label>

            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Judge Type</span>
              </div>
              <select
                className="select select-bordered w-full"
                value={formData.judgeType}
                onChange={(e) => handleInputChange("judgeType", e.target.value)}
              >
                <option value="">-- Select Judge Type --</option>
                {JUDGE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Judge Number</span>
              </div>
              <input
                type="number"
                className="input input-bordered w-full"
                min="1"
                max="10"
                value={formData.judgeNumber}
                onChange={(e) =>
                  handleInputChange(
                    "judgeNumber",
                    parseInt(e.target.value) || 1,
                  )
                }
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddJudge}
            >
              Add Judge
            </button>
          </div>
        </div>
      </section>

      <aside className="card border border-base-300 bg-base-100/90 shadow-lg">
        <div className="card-body gap-4">
          <h3 className="card-title text-lg">Judges List</h3>

          <div className="stats stats-vertical border border-base-300 bg-base-200/40 shadow-none">
            <div className="stat py-3">
              <div className="stat-title">Total Judges</div>
              <div className="stat-value text-base">{judges.length}</div>
            </div>
          </div>

          <div className="max-h-80 overflow-auto">
            {judges.length === 0 ? (
              <div className="alert border border-base-300 bg-base-200/60 text-base-content">
                <span>No judges added yet.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {judges.map((judge) => (
                  <div
                    key={judge.id}
                    className="flex items-center justify-between rounded-lg border border-base-300 bg-base-200/40 p-3"
                  >
                    <div>
                      <p className="font-semibold">{judge.fullName}</p>
                      <p className="text-xs text-base-content/70">
                        {judge.judgeTypeLabel} - #{judge.judgeNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost text-error"
                      onClick={() => handleRemoveJudge(judge.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AddJudgeForm;
