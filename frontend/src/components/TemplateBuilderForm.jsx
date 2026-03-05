import toast from "react-hot-toast";
import { useTemplateBuilder } from "../hooks/useTemplateBuilder";

function TemplateBuilderForm() {
  const {
    eventData,
    fields,
    isSubmitting,
    validFieldCount,
    updateEventData,
    updateField,
    addField,
    removeField,
    submitTemplate,
  } = useTemplateBuilder();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await submitTemplate();
    if (result.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-cyan-300/40 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <section className="card border border-base-300 bg-gradient-to-br from-slate-900 via-blue-800 to-teal-600 text-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">
              Template Builder
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Create Event Template
            </h1>
            <p className="mt-2 max-w-3xl text-sm opacity-95 md:text-base">
              Build a new template by entering event details and custom fields.
            </p>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="card border border-base-300 bg-base-100/90 shadow-xl"
          >
            <div className="card-body gap-5">
              <div>
                <h2 className="card-title">Event Details</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">
                      Template Name
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="e.g. Swimming Template"
                    value={eventData.name}
                    onChange={(e) => updateEventData("name", e.target.value)}
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">Event Type</span>
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="e.g. sports"
                    value={eventData.eventType}
                    onChange={(e) =>
                      updateEventData("eventType", e.target.value)
                    }
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">
                      Sport Label
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="e.g. Swimming"
                    value={eventData.sportLabel}
                    onChange={(e) =>
                      updateEventData("sportLabel", e.target.value)
                    }
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">
                      Sport Value
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="e.g. swimming"
                    value={eventData.sportValue}
                    onChange={(e) =>
                      updateEventData("sportValue", e.target.value)
                    }
                  />
                </label>
              </div>

              <label className="form-control">
                <div className="label pb-1">
                  <span className="label-text font-semibold">Description</span>
                </div>
                <textarea
                  className="textarea textarea-bordered min-h-24"
                  placeholder="Describe this template"
                  value={eventData.description}
                  onChange={(e) =>
                    updateEventData("description", e.target.value)
                  }
                />
              </label>

              <div className="divider my-0">Fields</div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-xl border border-base-300 bg-base-200/40 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">Field #{index + 1}</h3>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost text-error"
                        onClick={() => removeField(field.id)}
                        disabled={fields.length === 1}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="form-control w-full">
                        <div className="label pb-1">
                          <span className="label-text">Key</span>
                        </div>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          placeholder="e.g. heat_number"
                          value={field.key}
                          onChange={(e) =>
                            updateField(field.id, "key", e.target.value)
                          }
                        />
                      </label>

                      <label className="form-control w-full">
                        <div className="label pb-1">
                          <span className="label-text">Label</span>
                        </div>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          placeholder="e.g. Heat Number"
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.id, "label", e.target.value)
                          }
                        />
                      </label>

                      <label className="form-control w-full">
                        <div className="label pb-1">
                          <span className="label-text">Field Type</span>
                        </div>
                        <select
                          className="select select-bordered w-full"
                          value={field.fieldType}
                          onChange={(e) =>
                            updateField(field.id, "fieldType", e.target.value)
                          }
                        >
                          <option value="select">Select</option>
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                        </select>
                      </label>

                      <label className="form-control w-full">
                        <div className="label pb-1">
                          <span className="label-text">Required</span>
                        </div>
                        <select
                          className="select select-bordered w-full"
                          value={field.isRequired ? "yes" : "no"}
                          onChange={(e) =>
                            updateField(
                              field.id,
                              "isRequired",
                              e.target.value === "yes",
                            )
                          }
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </label>
                    </div>

                    {field.fieldType === "select" && (
                      <label className="form-control mt-3">
                        <div className="label pb-1">
                          <span className="label-text">
                            Select options (comma-separated)
                          </span>
                        </div>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          placeholder="e.g. Heat 1, Heat 2, Heat 3"
                          value={field.optionsText}
                          onChange={(e) =>
                            updateField(field.id, "optionsText", e.target.value)
                          }
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={addField}
                >
                  Add Field
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting ? "btn-disabled" : ""}`}
                >
                  {isSubmitting ? "Saving..." : "Create Template"}
                </button>
              </div>
            </div>
          </form>

          <aside className="card border border-base-300 bg-base-100/90 shadow-lg">
            <div className="card-body gap-4">
              <h3 className="card-title text-lg">Builder Summary</h3>

              <div className="stats stats-vertical border border-base-300 bg-base-200/40 shadow-none">
                <div className="stat py-3">
                  <div className="stat-title">Template Name</div>
                  <div className="stat-value text-base">
                    {eventData.name.trim() || "-"}
                  </div>
                </div>
                <div className="stat py-3">
                  <div className="stat-title">Event Type</div>
                  <div className="stat-value text-base">
                    {eventData.eventType.trim() || "-"}
                  </div>
                </div>
                <div className="stat py-3">
                  <div className="stat-title">Valid Fields</div>
                  <div className="stat-value text-base">{validFieldCount}</div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Payload Preview</p>
                <pre className="max-h-96 overflow-auto rounded-xl bg-neutral p-4 text-xs text-neutral-content">
                  {JSON.stringify(
                    {
                      ...eventData,
                      fields: fields.map((field) => ({
                        key: field.key,
                        label: field.label,
                        fieldType: field.fieldType,
                        isRequired: field.isRequired,
                        optionsText: field.optionsText,
                      })),
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default TemplateBuilderForm;
