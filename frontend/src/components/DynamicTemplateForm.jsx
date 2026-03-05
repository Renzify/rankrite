import { useEffect, useMemo, useState } from "react";
import { getTemplateByName, getTemplateCatalog } from "../api/templateApi";

function normalizeEventTypeLabel(value) {
  if (!value) return "";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFieldLabel(key) {
  if (!key) return "";
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function DynamicTemplateForm() {
  const [catalog, setCatalog] = useState([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [template, setTemplate] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      setIsCatalogLoading(true);
      try {
        const data = await getTemplateCatalog();
        if (!isMounted) return;
        setCatalog(data);
      } catch (error) {
        console.error("Failed to fetch template catalog:", error);
      } finally {
        if (isMounted) setIsCatalogLoading(false);
      }
    };

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const eventTypeOptions = useMemo(() => {
    const values = [...new Set(catalog.map((item) => item.eventType))];
    return values.map((value) => ({
      value,
      label: normalizeEventTypeLabel(value),
    }));
  }, [catalog]);

  const sportOptions = useMemo(() => {
    if (!selectedEventType) return [];

    const items = catalog.filter(
      (item) => item.eventType === selectedEventType,
    );
    const mapped = items.flatMap((item) =>
      (item.sports ?? []).map((sport) => ({
        value: sport.value,
        label: sport.label,
        templateName: item.name,
        sportCount: (item.sports ?? []).length,
      })),
    );

    const bestBySportValue = new Map();
    for (const option of mapped) {
      const existing = bestBySportValue.get(option.value);
      if (!existing || option.sportCount < existing.sportCount) {
        bestBySportValue.set(option.value, option);
      }
    }

    return [...bestBySportValue.values()];
  }, [catalog, selectedEventType]);

  useEffect(() => {
    setSelectedSport("");
    setTemplate(null);
    setFormValues({});
  }, [selectedEventType]);

  useEffect(() => {
    if (!selectedSport) {
      setTemplate(null);
      setFormValues({});
      return;
    }

    const selectedSportOption = sportOptions.find(
      (option) => option.value === selectedSport,
    );
    if (!selectedSportOption) {
      setTemplate(null);
      setFormValues({});
      return;
    }

    let isMounted = true;

    const loadTemplate = async () => {
      setIsTemplateLoading(true);
      try {
        const data = await getTemplateByName(selectedSportOption.templateName);
        if (!isMounted) return;

        const sortedFields = [...data.fields].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
        setTemplate({ ...data, fields: sortedFields });
        setFormValues({ sport: selectedSportOption.value });
      } catch (error) {
        console.error("Failed to fetch template:", error);
      } finally {
        if (isMounted) setIsTemplateLoading(false);
      }
    };

    loadTemplate();

    return () => {
      isMounted = false;
    };
  }, [selectedSport, sportOptions]);

  const isConditionMet = (condition, fields, values) => {
    const parentField = fields.find(
      (field) => field.id === condition.parentFieldId,
    );
    if (!parentField) return false;

    const selectedParentValue = values[parentField.key];
    if (!selectedParentValue) return false;

    const requiredOption = parentField.options?.find(
      (option) => option.id === condition.parentOptionId,
    );
    if (!requiredOption) return false;

    return selectedParentValue === requiredOption.value;
  };

  const getFilteredOptions = (field, fields, values) => {
    const options = field.options ?? [];
    const dependencies = field.optionDependencies ?? [];

    if (!dependencies.length) return options;

    return options.filter((option) => {
      const optionDeps = dependencies.filter(
        (dependency) => dependency.childOptionId === option.id,
      );
      if (!optionDeps.length) return false;

      return optionDeps.some((dependency) =>
        isConditionMet(
          {
            parentFieldId: dependency.parentFieldId,
            parentOptionId: dependency.parentOptionId,
          },
          fields,
          values,
        ),
      );
    });
  };

  const handleChange = (fieldKey, value) => {
    setFormValues((prev) => {
      const next = {
        ...prev,
        [fieldKey]: value,
      };

      if (!template) return next;

      const changedField = template.fields.find(
        (field) => field.key === fieldKey,
      );
      if (!changedField) return next;

      for (const field of template.fields) {
        if (field.sortOrder > changedField.sortOrder) {
          delete next[field.key];
        }
      }

      return next;
    });
  };

  const visibleFields = useMemo(() => {
    if (!template) return [];

    return template.fields.filter((field) => {
      if (field.key === "sport") return false;
      if (!field.conditions?.length) return true;

      return field.conditions.some((condition) =>
        isConditionMet(condition, template.fields, formValues),
      );
    });
  }, [template, formValues]);

  const totalSports = useMemo(
    () => [...new Set(catalog.flatMap((item) => (item.sports ?? []).map((sport) => sport.value)))]
      .length,
    [catalog],
  );

  const formStage = template
    ? "details"
    : selectedSport
      ? "template"
      : selectedEventType
        ? "sport"
        : "event";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-300/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-emerald-300/50 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <section className="card border border-base-300 bg-gradient-to-br from-sky-900 via-blue-700 to-cyan-600 text-base-100 shadow-xl">
          <div className="card-body gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">
                RankRite
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                Dynamic Event Template Builder
              </h1>
              <p className="mt-2 max-w-3xl text-sm opacity-95 md:text-base">
                Start with event type, pick a sport, then fill only the fields
                that match your selected flow.
              </p>
            </div>

            <div className="stats stats-vertical border border-white/20 bg-white/15 text-base-100 shadow-none sm:stats-horizontal">
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Templates</div>
                <div className="stat-value text-2xl">{catalog.length}</div>
              </div>
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Sports</div>
                <div className="stat-value text-2xl">{totalSports}</div>
              </div>
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Stage</div>
                <div className="stat-value text-2xl capitalize">{formStage}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-sm">
          <ul className="steps steps-vertical w-full sm:steps-horizontal">
            <li className={`step ${selectedEventType ? "step-primary" : ""}`}>
              Event Type
            </li>
            <li className={`step ${selectedSport ? "step-primary" : ""}`}>
              Sport
            </li>
            <li className={`step ${template ? "step-primary" : ""}`}>
              Template Details
            </li>
          </ul>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
          <section className="card border border-base-300 bg-base-100/90 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Selector Panel</h2>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">Event Type</span>
                  </div>
                  <select
                    id="event_type"
                    className="select select-bordered w-full"
                    value={selectedEventType}
                    onChange={(event) => setSelectedEventType(event.target.value)}
                    disabled={isCatalogLoading}
                  >
                    <option value="">Choose event type</option>
                    {eventTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">Sport</span>
                  </div>
                  <select
                    id="sport"
                    className="select select-bordered w-full"
                    value={selectedSport}
                    onChange={(event) => setSelectedSport(event.target.value)}
                    disabled={!selectedEventType || !sportOptions.length}
                  >
                    <option value="">Choose sport</option>
                    {sportOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <aside className="card border border-base-300 bg-base-100/90 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-lg">Current Values</h3>
              <pre className="max-h-96 overflow-auto rounded-xl bg-neutral p-4 text-xs text-neutral-content">
                {JSON.stringify(
                  {
                    event_type: selectedEventType,
                    sport: selectedSport,
                    ...formValues,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </aside>
        </div>

        {selectedEventType && !sportOptions.length && !isCatalogLoading && (
          <div className="alert alert-info shadow-sm">
            <span>No templates available for this event type yet.</span>
          </div>
        )}

        {isTemplateLoading && (
          <div className="alert border border-base-300 bg-base-100 shadow-sm">
            <span className="loading loading-spinner loading-sm" />
            <span>Loading template details...</span>
          </div>
        )}

        {template && (
          <section className="card border border-base-300 bg-base-100/90 shadow-xl">
            <div className="card-body gap-5">
              <div>
                <div className="badge badge-primary badge-outline mb-2">
                  Loaded Template
                </div>
                <h2 className="text-2xl font-bold">{template.name}</h2>
                {template.description && (
                  <p className="mt-2 text-sm text-base-content/70">
                    {template.description}
                  </p>
                )}
              </div>

              <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleFields.map((field) => {
                  const fieldOptions = getFilteredOptions(
                    field,
                    template.fields,
                    formValues,
                  );

                  if (field.fieldType !== "select") return null;

                  return (
                    <label key={field.id} className="form-control w-full">
                      <div className="label pb-1">
                        <span className="label-text font-semibold">
                          {field.label || formatFieldLabel(field.key)}
                        </span>
                      </div>
                      <select
                        id={field.key}
                        className="select select-bordered w-full"
                        value={formValues[field.key] || ""}
                        onChange={(event) =>
                          handleChange(field.key, event.target.value)
                        }
                      >
                        <option value="">Select {formatFieldLabel(field.key)}</option>
                        {fieldOptions.map((option) => (
                          <option key={option.id} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default DynamicTemplateForm;
