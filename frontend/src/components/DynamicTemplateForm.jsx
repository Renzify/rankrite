import { useMemo } from "react";
import { useDynamicTemplate } from "../hooks/useDynamicTemplate";

const STAGES = [
  { key: "eventType", label: "Event Type" },
  { key: "sport", label: "Sport" },
  { key: "details", label: "Template Details" },
];

function getActiveStageIndex(selectedEventType, selectedSport) {
  if (!selectedEventType) return 0;
  if (!selectedSport) return 1;
  return 2;
}

function DynamicTemplateForm() {
  const {
    catalog,
    isCatalogLoading,
    catalogError,
    selectedEventType,
    selectedSport,
    template,
    formValues,
    isTemplateLoading,
    templateError,
    eventTypeOptions,
    sportOptions,
    visibleFields,
    setSelectedEventType,
    setSelectedSport,
    updateFieldValue,
    getFilteredOptions,
  } = useDynamicTemplate();

  const activeStageIndex = getActiveStageIndex(
    selectedEventType,
    selectedSport,
  );
  const totalSports = useMemo(
    () =>
      selectedEventType
        ? catalog
            .filter((item) => item.eventType === selectedEventType)
            .reduce((count, item) => count + (item.sports?.length ?? 0), 0)
        : 0,
    [catalog, selectedEventType],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-emerald-300/40 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <section className="card border border-base-300 bg-gradient-to-br from-slate-900 via-blue-800 to-cyan-600 text-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">
              Event Setup
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Dynamic Template Form
            </h1>
            <p className="mt-2 max-w-3xl text-sm opacity-95 md:text-base">
              Select an event type, choose a sport, then fill in only the fields
              required by that template.
            </p>

            <div className="stats stats-vertical mt-4 border border-white/30 bg-white/10 shadow-none sm:stats-horizontal">
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Event Types</div>
                <div className="stat-value text-2xl text-base-100">
                  {eventTypeOptions.length}
                </div>
              </div>
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Sports</div>
                <div className="stat-value text-2xl text-base-100">
                  {selectedEventType ? totalSports : "-"}
                </div>
              </div>
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Fields</div>
                <div className="stat-value text-2xl text-base-100">
                  {template ? visibleFields.length : "-"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="card border border-base-300 bg-base-100/90 shadow-sm">
          <div className="card-body gap-2">
            <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {STAGES.map((stage, index) => {
                const isActive = activeStageIndex === index;
                const isConnectorActive =
                  index < STAGES.length - 1 &&
                  (activeStageIndex === index ||
                    activeStageIndex === index + 1);

                return (
                  <div key={stage.key} className="contents">
                    <div
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-base-300 bg-base-100 text-base-content/70"
                      }`}
                    >
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                        {index + 1}
                      </span>
                      {stage.label}
                    </div>
                    {index < STAGES.length - 1 && (
                      <div
                        className={`hidden h-1 w-10 rounded-full sm:block ${
                          isConnectorActive ? "bg-primary" : "bg-base-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <section className="card border border-base-300 bg-base-100/90 shadow-xl">
            <div className="card-body gap-5">
              <h2 className="card-title">Template Selection</h2>

              {catalogError ? (
                <div className="alert alert-error">
                  <span>{catalogError}</span>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">
                      Select Event Type
                    </span>
                  </div>
                  <select
                    className={`select select-bordered w-full ${isCatalogLoading ? "select-disabled" : ""}`}
                    value={selectedEventType}
                    onChange={(event) =>
                      setSelectedEventType(event.target.value)
                    }
                    disabled={isCatalogLoading}
                  >
                    <option value="">-- Select Event Type --</option>
                    {eventTypeOptions.map((eventType) => (
                      <option key={eventType.value} value={eventType.value}>
                        {eventType.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">
                      Select Sport
                    </span>
                  </div>
                  <select
                    className={`select select-bordered w-full ${!selectedEventType || isCatalogLoading ? "select-disabled" : ""}`}
                    value={selectedSport}
                    onChange={(event) => setSelectedSport(event.target.value)}
                    disabled={!selectedEventType || isCatalogLoading}
                  >
                    <option value="">-- Select Sport --</option>
                    {sportOptions.map((sport) => (
                      <option key={sport.value} value={sport.value}>
                        {sport.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {!selectedSport ? (
                <div className="alert border border-base-300 bg-base-200/60 text-base-content">
                  <span>
                    Choose a sport to load its template-specific fields.
                  </span>
                </div>
              ) : null}

              {selectedSport && isTemplateLoading ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="loading loading-spinner loading-sm" />
                  Loading template...
                </div>
              ) : null}

              {selectedSport && templateError ? (
                <div className="alert alert-error">
                  <span>{templateError}</span>
                </div>
              ) : null}

              {selectedSport &&
              template &&
              !isTemplateLoading &&
              !templateError ? (
                <form className="space-y-4">
                  <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                      Template
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {template.name}
                    </h3>
                    <p className="mt-1 text-sm text-base-content/70">
                      {template.description}
                    </p>
                  </div>

                  {visibleFields.length === 0 ? (
                    <div className="alert border border-base-300 bg-base-200/60 text-base-content">
                      <span>
                        No additional fields are required for this sport.
                      </span>
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

                            {field.fieldType === "select" ? (
                              <select
                                className={`select select-bordered w-full ${fieldOptions.length === 0 ? "select-disabled" : ""}`}
                                id={field.key}
                                value={formValues[field.key] || ""}
                                onChange={(event) =>
                                  updateFieldValue(
                                    field.key,
                                    event.target.value,
                                  )
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
                            ) : null}

                            {field.fieldType === "text" ? (
                              <input
                                id={field.key}
                                type="text"
                                className="input input-bordered w-full"
                                value={formValues[field.key] || ""}
                                onChange={(event) =>
                                  updateFieldValue(
                                    field.key,
                                    event.target.value,
                                  )
                                }
                              />
                            ) : null}

                            {field.fieldType === "number" ? (
                              <input
                                id={field.key}
                                type="number"
                                className="input input-bordered w-full"
                                value={formValues[field.key] || ""}
                                onChange={(event) =>
                                  updateFieldValue(
                                    field.key,
                                    event.target.value,
                                  )
                                }
                              />
                            ) : null}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </form>
              ) : null}
            </div>
          </section>

          <aside className="card border border-base-300 bg-base-100/90 shadow-lg">
            <div className="card-body gap-4">
              <h3 className="card-title text-lg">Current Values</h3>

              <div className="stats stats-vertical border border-base-300 bg-base-200/40 shadow-none">
                <div className="stat py-3">
                  <div className="stat-title">Event Type</div>
                  <div className="stat-value text-base">
                    {selectedEventType || "-"}
                  </div>
                </div>
                <div className="stat py-3">
                  <div className="stat-title">Sport</div>
                  <div className="stat-value text-base">
                    {selectedSport || "-"}
                  </div>
                </div>
                <div className="stat py-3">
                  <div className="stat-title">Visible Fields</div>
                  <div className="stat-value text-base">
                    {template ? visibleFields.length : 0}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Form Data Preview</p>
                <pre className="max-h-96 overflow-auto rounded-xl bg-neutral p-4 text-xs text-neutral-content">
                  {JSON.stringify(formValues, null, 2)}
                </pre>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default DynamicTemplateForm;
