import { useState } from "react";
import { useTemplateStore } from "../stores/templateStore";

const JUDGE_TYPES = [
  "Difficulty Body",
  "Difficulty Apparatus",
  "Artistry",
  "Execution",
  "Time Judge",
  "Line Judge",
];

function JudgesTab() {
  const judges = useTemplateStore((state) => state.judges);
  const addJudge = useTemplateStore((state) => state.addJudge);
  const removeJudge = useTemplateStore((state) => state.removeJudge);
  const updateJudge = useTemplateStore((state) => state.updateJudge);

  const [formData, setFormData] = useState({
    fullName: "",
    judgeType: "",
    judgeNumber: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddJudge = () => {
    if (
      !formData.fullName.trim() ||
      !formData.judgeType ||
      !formData.judgeNumber
    ) {
      alert("Please fill in all fields");
      return;
    }

    addJudge({
      fullName: formData.fullName,
      judgeType: formData.judgeType,
      judgeNumber: parseInt(formData.judgeNumber),
    });

    setFormData({
      fullName: "",
      judgeType: "",
      judgeNumber: "",
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Add Judges</h3>

      {/* Add Judge Form */}
      <div className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <div className="space-y-4">
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">
                  Full Name <span className="text-error">*</span>
                </span>
              </div>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter judge's name"
                className="input input-bordered w-full"
              />
            </label>

            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">
                  Judge Type <span className="text-error">*</span>
                </span>
              </div>
              <select
                name="judgeType"
                value={formData.judgeType}
                onChange={handleInputChange}
                className="select select-bordered w-full"
              >
                <option value="">-- Select Type --</option>
                {JUDGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">
                  Judge Seat Number <span className="text-error">*</span>
                </span>
              </div>
              <input
                type="number"
                name="judgeNumber"
                value={formData.judgeNumber}
                onChange={handleInputChange}
                placeholder="1"
                min="1"
                className="input input-bordered w-full"
              />
            </label>
          </div>

          <button
            onClick={handleAddJudge}
            className="btn btn-primary mt-3 w-full sm:w-auto"
          >
            + Add Judge
          </button>
        </div>
      </div>
    </div>
  );
}

export default JudgesTab;
