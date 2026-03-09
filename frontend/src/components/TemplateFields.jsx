function TemplateFields({
  template,
  formValues,
  visibleFields,
  isTemplateLoading,
  templateError,
  updateFieldValue,
  getFilteredOptions,
}) {
  if (!template || isTemplateLoading || templateError) {
    return null;
  }

  return (
    <form className="space-y-4">
      <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
          Template
        </p>
        <h3 className="mt-1 text-lg font-semibold">{template.name}</h3>
        <p className="mt-1 text-sm text-base-content/70">
          {template.description}
        </p>
      </div>

      {visibleFields.length === 0 ? (
        <div className="alert border border-base-300 bg-base-200/60 text-base-content">
          <span>No additional fields are required for this sport.</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleFields.map((field) => {
            const fieldOptions = getFilteredOptions(field);

            return (
              <label key={field.id} className="form-control w-full">
                <div className="label pb-1">
                  <span className="label-text font-semibold">
                    {field.label}
                  </span>
                </div>

                {field.fieldType === "select" && (
                  <select
                    className={`select select-bordered w-full ${fieldOptions.length === 0 ? "select-disabled" : ""}`}
                    id={field.key}
                    value={formValues[field.key] || ""}
                    onChange={(event) =>
                      updateFieldValue(field.key, event.target.value)
                    }
                    disabled={fieldOptions.length === 0}
                  >
                    <option value="">-- Select --</option>
                    {fieldOptions.map((option) => (
                      <option key={option.id} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.fieldType === "text" && (
                  <input
                    id={field.key}
                    type="text"
                    className="input input-bordered w-full"
                    value={formValues[field.key] || ""}
                    onChange={(event) =>
                      updateFieldValue(field.key, event.target.value)
                    }
                  />
                )}

                {field.fieldType === "number" && (
                  <input
                    id={field.key}
                    type="number"
                    className="input input-bordered w-full"
                    value={formValues[field.key] || ""}
                    onChange={(event) =>
                      updateFieldValue(field.key, event.target.value)
                    }
                  />
                )}
              </label>
            );
          })}
        </div>
      )}
    </form>
  );
}

export default TemplateFields;
