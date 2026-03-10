import { useState } from "react";
import { useTemplateStore } from "../stores/templateStore";

const GENDER_OPTIONS = ["Male", "Female"];

function ContestantsTab() {
  const contestants = useTemplateStore((state) => state.contestants);
  const addContestant = useTemplateStore((state) => state.addContestant);
  const removeContestant = useTemplateStore((state) => state.removeContestant);
  const updateContestant = useTemplateStore((state) => state.updateContestant);

  const [formData, setFormData] = useState({
    fullName: "",
    teamName: "",
    gender: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddContestant = () => {
    if (!formData.fullName.trim()) {
      alert("Please enter contestant's name");
      return;
    }

    addContestant({
      fullName: formData.fullName,
      teamName: formData.teamName || "",
      gender: formData.gender || "",
    });

    setFormData({
      fullName: "",
      teamName: "",
      gender: "",
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Add Contestants</h3>

      {/* Add Contestant Form */}
      <div className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-control w-full sm:col-span-2">
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
                placeholder="Enter contestant's name"
                className="input input-bordered w-full"
              />
            </label>

            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Team Name</span>
              </div>
              <input
                type="text"
                name="teamName"
                value={formData.teamName}
                onChange={handleInputChange}
                placeholder="Enter team name (optional)"
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
          </div>

          <button
            onClick={handleAddContestant}
            className="btn btn-primary mt-3 w-full sm:w-auto"
          >
            + Add Contestant
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContestantsTab;
