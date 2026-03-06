import { useState } from "react";
import { useTemplateStore } from "../stores/templateStore";
import toast from "react-hot-toast";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "mixed", label: "Mixed" },
];

function AddContestantForm() {
  const { contestants, addContestant, removeContestant } = useTemplateStore();

  const [formData, setFormData] = useState({
    fullName: "",
    teamName: "",
    gender: "",
    entryNo: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddContestant = () => {
    if (!formData.fullName.trim()) {
      toast.error("Please enter contestant's full name");
      return;
    }
    if (!formData.entryNo) {
      toast.error("Please enter an entry number");
      return;
    }

    // Check if entry number already exists
    const entryExists = contestants.some(
      (c) => c.entryNo === parseInt(formData.entryNo),
    );
    if (entryExists) {
      toast.error("Entry number already exists");
      return;
    }

    addContestant({
      id: crypto.randomUUID(),
      fullName: formData.fullName.trim(),
      teamName: formData.teamName.trim(),
      gender: formData.gender,
      entryNo: parseInt(formData.entryNo),
    });

    toast.success("Contestant added successfully");
    setFormData({
      fullName: "",
      teamName: "",
      gender: "",
      entryNo: "",
    });
  };

  const handleRemoveContestant = (id) => {
    removeContestant(id);
    toast.success("Contestant removed");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body gap-5">
          <h2 className="card-title">Add Contestants</h2>
          <p className="text-sm text-base-content/70">
            Add contestants to the event. Each contestant needs a unique entry
            number.
          </p>

          <div className="divider my-0">New Contestant</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Full Name</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. Jane Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
              />
            </label>

            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Team Name</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. Manila Team"
                value={formData.teamName}
                onChange={(e) => handleInputChange("teamName", e.target.value)}
              />
            </label>

            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Gender</span>
              </div>
              <select
                className="select select-bordered w-full"
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
              >
                <option value="">-- Select Gender --</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Entry Number</span>
              </div>
              <input
                type="number"
                className="input input-bordered w-full"
                placeholder="e.g. 1"
                min="1"
                value={formData.entryNo}
                onChange={(e) => handleInputChange("entryNo", e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddContestant}
            >
              Add Contestant
            </button>
          </div>
        </div>
      </section>

      <aside className="card border border-base-300 bg-base-100/90 shadow-lg">
        <div className="card-body gap-4">
          <h3 className="card-title text-lg">Contestants List</h3>

          <div className="stats stats-vertical border border-base-300 bg-base-200/40 shadow-none">
            <div className="stat py-3">
              <div className="stat-title">Total Contestants</div>
              <div className="stat-value text-base">{contestants.length}</div>
            </div>
          </div>

          <div className="max-h-80 overflow-auto">
            {contestants.length === 0 ? (
              <div className="alert border border-base-300 bg-base-200/60 text-base-content">
                <span>No contestants added yet.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {contestants
                  .sort((a, b) => a.entryNo - b.entryNo)
                  .map((contestant) => (
                    <div
                      key={contestant.id}
                      className="flex items-center justify-between rounded-lg border border-base-300 bg-base-200/40 p-3"
                    >
                      <div>
                        <p className="font-semibold">
                          #{contestant.entryNo} - {contestant.fullName}
                        </p>
                        <p className="text-xs text-base-content/70">
                          {contestant.teamName && `${contestant.teamName} • `}
                          {contestant.gender && contestant.gender.toUpperCase()}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost text-error"
                        onClick={() => handleRemoveContestant(contestant.id)}
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

export default AddContestantForm;
