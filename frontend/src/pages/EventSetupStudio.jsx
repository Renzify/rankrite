
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { getTemplateByName, getTemplateCatalog } from "../api/templateApi";
import { useEventStore } from "../stores/eventStore";

const STEPS = ["Basic Info", "Fields", "Dependencies", "Review"];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
}

function createField() {
  return {
    id: crypto.randomUUID(),
    key: "",
    label: "",
    fieldType: "select",
    isRequired: true,
    options: [],
    optionInput: "",
    bulkInput: "",
  };
}

function mapTemplateField(field) {
  return {
    id: field.id,
    key: field.key,
    label: field.label,
    fieldType: field.fieldType,
    isRequired: field.isRequired,
    options: (field.options ?? []).map((option) => ({
      id: option.id,
      label: option.label,
      value: option.value,
    })),
    optionInput: "",
    bulkInput: "",
  };
}

function EventSetupStudio() {
  const navigate = useNavigate();
  const addEvent = useEventStore((state) => state.addEvent);

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("template");

  const [catalog, setCatalog] = useState([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  const [basic, setBasic] = useState({
    title: "",
    eventType: "",
    templateName: "",
    sport: "",
    status: "to_be_held",
  });

  const [fields, setFields] = useState([createField()]);
  const [deps, setDeps] = useState([]);
  const [loadedTemplateName, setLoadedTemplateName] = useState("");
  const [parentFieldId, setParentFieldId] = useState("");
  const [childFieldId, setChildFieldId] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadCatalog = async () => {
      setIsCatalogLoading(true);
      setCatalogError(null);
      try {
        const data = await getTemplateCatalog();
        if (mounted) setCatalog(data);
      } catch (error) {
        console.error(error);
        if (mounted) setCatalogError("Failed to load template catalog.");
      } finally {
        if (mounted) setIsCatalogLoading(false);
      }
    };

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const eventTypeOptions = useMemo(() => {
    const values = [...new Set(catalog.map((item) => item.eventType))];
    return values.map((value) => ({
      value,
      label: value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    }));
  }, [catalog]);

  const templateOptions = useMemo(
    () => catalog.filter((item) => item.eventType === basic.eventType),
    [catalog, basic.eventType],
  );

  const selectedTemplate = useMemo(
    () => templateOptions.find((item) => item.name === basic.templateName) || null,
    [templateOptions, basic.templateName],
  );

  const selectFields = useMemo(
    () => fields.filter((field) => field.fieldType === "select" && field.options.length > 0),
    [fields],
  );

  const parentField = selectFields.find((field) => field.id === parentFieldId);
  const childField = selectFields.find((field) => field.id === childFieldId);

  useEffect(() => {
    if (!parentField && selectFields[0]) setParentFieldId(selectFields[0].id);

    const availableChild = selectFields.find((field) => field.id !== parentFieldId);
    if (!childField || childFieldId === parentFieldId) {
      setChildFieldId(availableChild?.id ?? "");
    }
  }, [selectFields, parentField, childField, parentFieldId, childFieldId]);

  const setBasicValue = (key, value) => {
    setBasic((prev) => ({ ...prev, [key]: value }));
  };

  const setFieldValue = (fieldId, key, value) => {
    setFields((prev) =>
      prev.map((field) => (field.id === fieldId ? { ...field, [key]: value } : field)),
    );
  };

  const addField = () => setFields((prev) => [...prev, createField()]);
  const removeField = (fieldId) => {
    setFields((prev) => prev.filter((field) => field.id !== fieldId));
    setDeps((prev) =>
      prev.filter((dep) => dep.parentFieldId !== fieldId && dep.childFieldId !== fieldId),
    );
  };

  const addOption = (field) => {
    const label = field.optionInput.trim();
    if (!label) return;
    const value = slugify(label);
    if (!value) return;

    const merged = [...field.options, { id: crypto.randomUUID(), label, value }];
    const dedup = merged.filter(
      (option, index) => merged.findIndex((o) => o.value === option.value) === index,
    );

    setFieldValue(field.id, "options", dedup);
    setFieldValue(field.id, "optionInput", "");
  };

  const applyBulkOptions = (field) => {
    const lines = field.bulkInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      toast.error("Enter at least one option line.");
      return;
    }

    const incoming = lines
      .map((label) => ({ id: crypto.randomUUID(), label, value: slugify(label) }))
      .filter((option) => option.value);

    const merged = [...field.options, ...incoming];
    const dedup = merged.filter(
      (option, index) => merged.findIndex((o) => o.value === option.value) === index,
    );

    setFieldValue(field.id, "options", dedup);
    setFieldValue(field.id, "bulkInput", "");
    toast.success(`Added ${incoming.length} option(s).`);
  };

  const removeOption = (field, optionId) => {
    const nextOptions = field.options.filter((option) => option.id !== optionId);
    setFieldValue(field.id, "options", nextOptions);

    setDeps((prev) =>
      prev.filter(
        (dep) => dep.parentOptionId !== optionId && dep.childOptionId !== optionId,
      ),
    );
  };

  const loadTemplate = async () => {
    if (!basic.templateName || !basic.sport) {
      toast.error("Select template and sport first.");
      return;
    }

    try {
      setIsTemplateLoading(true);
      const template = await getTemplateByName(basic.templateName);

      const nextFields = (template.fields ?? [])
        .filter((field) => field.key !== "sport")
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(mapTemplateField);

      const nextDeps = (template.fields ?? []).flatMap((field) =>
        (field.optionDependencies ?? []).map((dep) => ({
          parentFieldId: dep.parentFieldId,
          parentOptionId: dep.parentOptionId,
          childFieldId: dep.childFieldId,
          childOptionId: dep.childOptionId,
        })),
      );

      setFields(nextFields.length ? nextFields : [createField()]);
      setDeps(nextDeps);
      setLoadedTemplateName(basic.templateName);
      toast.success("Template loaded.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load template.");
    } finally {
      setIsTemplateLoading(false);
    }
  };

  const hasDep = (parentOptionId, childOptionId) =>
    deps.some(
      (dep) =>
        dep.parentFieldId === parentFieldId &&
        dep.childFieldId === childFieldId &&
        dep.parentOptionId === parentOptionId &&
        dep.childOptionId === childOptionId,
    );

  const toggleDep = (parentOptionId, childOptionId) => {
    if (!parentFieldId || !childFieldId) return;

    setDeps((prev) => {
      const exists = prev.find(
        (dep) =>
          dep.parentFieldId === parentFieldId &&
          dep.childFieldId === childFieldId &&
          dep.parentOptionId === parentOptionId &&
          dep.childOptionId === childOptionId,
      );

      if (exists) {
        return prev.filter((dep) => dep !== exists);
      }

      return [
        ...prev,
        { parentFieldId, childFieldId, parentOptionId, childOptionId },
      ];
    });
  };

  const normalizedFields = useMemo(
    () =>
      fields.map((field, index) => ({
        key: slugify(field.key || field.label || `field_${index + 1}`),
        label: field.label.trim() || `Field ${index + 1}`,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        sortOrder: index + 1,
        options: field.options.map((option, optionIndex) => ({
          id: option.id,
          value: option.value,
          label: option.label,
          sortOrder: optionIndex + 1,
        })),
      })),
    [fields],
  );

  const payload = {
    mode,
    basicInfo: {
      title: basic.title.trim(),
      eventType: basic.eventType,
      sport: basic.sport,
      status: basic.status,
      templateName: mode === "template" ? loadedTemplateName || null : null,
    },
    fields: normalizedFields,
    optionDependencies: deps,
  };

  const invalidFields = normalizedFields.filter((field) => {
    if (!field.key || !field.label) return true;
    if (field.fieldType !== "select") return false;
    return field.options.length === 0;
  });

  const canContinueBasic =
    basic.title.trim() &&
    basic.eventType &&
    basic.sport &&
    (mode === "manual" || loadedTemplateName === basic.templateName);

  const canContinueFields = normalizedFields.length > 0 && invalidFields.length === 0;

  const canContinue = [canContinueBasic, canContinueFields, true, true][step];

  const createDraft = () => {
    if (!canContinueBasic || !canContinueFields) {
      toast.error("Complete Basic Info and Fields first.");
      return;
    }

    addEvent({
      title: basic.title.trim(),
      templateName:
        mode === "template" ? loadedTemplateName || "Template Studio" : "Manual Studio",
      sport: basic.sport,
      status: basic.status,
      formValues: {
        eventType: basic.eventType,
        mode,
        setup: payload,
      },
    });

    toast.success("Event draft created in Event Management.");
    navigate("/events");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-20 h-64 w-64 rounded-full bg-cyan-300/40 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8">
        <section className="card border border-base-300 bg-gradient-to-br from-slate-900 via-teal-800 to-emerald-600 text-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">
              New Page
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Event Setup Studio</h1>
            <p className="mt-2 max-w-3xl text-sm opacity-95 md:text-base">
              Separate wizard for template/manual event setup with bulk options and dependency matrix.
            </p>
          </div>
        </section>

        <section className="card border border-base-300 bg-base-100/90 shadow-sm">
          <div className="card-body py-3">
            <div className="grid gap-2 md:grid-cols-4">
              {STEPS.map((label, index) => (
                <button
                  key={label}
                  className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                    step === index
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-base-300 bg-base-100 text-base-content/70"
                  }`}
                  onClick={() => setStep(index)}
                >
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                    {index + 1}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {step === 0 ? (
          <section className="card border border-base-300 bg-base-100/90 shadow-xl">
            <div className="card-body gap-4">
              <h2 className="card-title">Basic Info</h2>

              <div className="tabs tabs-boxed">
                <button
                  className={`tab ${mode === "template" ? "tab-active" : ""}`}
                  onClick={() => setMode("template")}
                >
                  Use Template
                </button>
                <button
                  className={`tab ${mode === "manual" ? "tab-active" : ""}`}
                  onClick={() => {
                    setMode("manual");
                    setBasic((prev) => ({ ...prev, templateName: "", sport: "" }));
                    setLoadedTemplateName("");
                    setFields([createField()]);
                    setDeps([]);
                  }}
                >
                  Build Manually
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input input-bordered"
                  placeholder="Event title"
                  value={basic.title}
                  onChange={(event) => setBasicValue("title", event.target.value)}
                />
                <select
                  className={`select select-bordered ${isCatalogLoading ? "select-disabled" : ""}`}
                  value={basic.eventType}
                  onChange={(event) => {
                    setBasicValue("eventType", event.target.value);
                    setBasicValue("templateName", "");
                    setBasicValue("sport", "");
                    setLoadedTemplateName("");
                  }}
                  disabled={isCatalogLoading}
                >
                  <option value="">-- Select Event Type --</option>
                  {eventTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {mode === "template" ? (
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <select
                    className="select select-bordered"
                    value={basic.templateName}
                    onChange={(event) => {
                      setBasicValue("templateName", event.target.value);
                      setBasicValue("sport", "");
                      setLoadedTemplateName("");
                    }}
                    disabled={!basic.eventType}
                  >
                    <option value="">-- Select Template --</option>
                    {templateOptions.map((option) => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="select select-bordered"
                    value={basic.sport}
                    onChange={(event) => setBasicValue("sport", event.target.value)}
                    disabled={!selectedTemplate}
                  >
                    <option value="">-- Select Sport --</option>
                    {(selectedTemplate?.sports ?? []).map((sport) => (
                      <option key={sport.value} value={sport.value}>
                        {sport.label}
                      </option>
                    ))}
                  </select>

                  <button
                    className={`btn btn-primary ${isTemplateLoading ? "btn-disabled" : ""}`}
                    onClick={loadTemplate}
                  >
                    {isTemplateLoading ? "Loading..." : "Load"}
                  </button>
                </div>
              ) : (
                <input
                  className="input input-bordered"
                  placeholder="Sport (e.g. gymnastics)"
                  value={basic.sport}
                  onChange={(event) => setBasicValue("sport", event.target.value)}
                />
              )}

              {catalogError ? <div className="alert alert-error"><span>{catalogError}</span></div> : null}
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="card border border-base-300 bg-base-100/90 shadow-xl">
            <div className="card-body gap-4">
              <div className="flex items-center justify-between">
                <h2 className="card-title">Fields</h2>
                <button className="btn btn-outline btn-sm" onClick={addField}>Add Field</button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="rounded-xl border border-base-300 bg-base-200/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Field #{index + 1}</h3>
                    <button className="btn btn-xs btn-ghost text-error" onClick={() => removeField(field.id)} disabled={fields.length === 1}>Remove</button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className="input input-bordered" placeholder="key" value={field.key} onChange={(e) => setFieldValue(field.id, "key", e.target.value)} />
                    <input className="input input-bordered" placeholder="label" value={field.label} onChange={(e) => setFieldValue(field.id, "label", e.target.value)} />
                    <select className="select select-bordered" value={field.fieldType} onChange={(e) => setFieldValue(field.id, "fieldType", e.target.value)}>
                      <option value="select">Select</option>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                    </select>
                    <select className="select select-bordered" value={field.isRequired ? "yes" : "no"} onChange={(e) => setFieldValue(field.id, "isRequired", e.target.value === "yes")}>
                      <option value="yes">Required</option>
                      <option value="no">Optional</option>
                    </select>
                  </div>

                  {field.fieldType === "select" ? (
                    <div className="mt-3 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <input className="input input-bordered" placeholder="Add option" value={field.optionInput} onChange={(e) => setFieldValue(field.id, "optionInput", e.target.value)} />
                        <button className="btn btn-outline" onClick={() => addOption(field)}>Add</button>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <textarea className="textarea textarea-bordered min-h-20" placeholder={"Bulk options, one per line\nVault\nBeam"} value={field.bulkInput} onChange={(e) => setFieldValue(field.id, "bulkInput", e.target.value)} />
                        <button className="btn btn-outline" onClick={() => applyBulkOptions(field)}>Apply Bulk</button>
                      </div>

                      <div className="space-y-1">
                        {field.options.map((option) => (
                          <div key={option.id} className="flex items-center justify-between rounded border border-base-300 bg-base-100 px-2 py-1">
                            <span className="text-sm">{option.label}</span>
                            <button className="btn btn-xs btn-ghost text-error" onClick={() => removeOption(field, option.id)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="card border border-base-300 bg-base-100/90 shadow-xl">
            <div className="card-body gap-4">
              <h2 className="card-title">Dependencies Matrix</h2>

              {selectFields.length < 2 ? (
                <div className="alert border border-base-300 bg-base-200/60 text-base-content">
                  <span>Add at least two select fields with options.</span>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select className="select select-bordered" value={parentFieldId} onChange={(e) => setParentFieldId(e.target.value)}>
                      {selectFields.map((field) => (
                        <option key={field.id} value={field.id}>{field.label || field.key || field.id}</option>
                      ))}
                    </select>
                    <select className="select select-bordered" value={childFieldId} onChange={(e) => setChildFieldId(e.target.value)}>
                      {selectFields.filter((field) => field.id !== parentFieldId).map((field) => (
                        <option key={field.id} value={field.id}>{field.label || field.key || field.id}</option>
                      ))}
                    </select>
                  </div>

                  {parentField && childField ? (
                    <div className="overflow-x-auto rounded-xl border border-base-300">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Parent Option</th>
                            {childField.options.map((option) => (
                              <th key={option.id} className="text-center">{option.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parentField.options.map((parentOption) => (
                            <tr key={parentOption.id}>
                              <td className="font-semibold">{parentOption.label}</td>
                              {childField.options.map((childOption) => (
                                <td key={childOption.id} className="text-center">
                                  <input type="checkbox" className="checkbox checkbox-sm" checked={hasDep(parentOption.id, childOption.id)} onChange={() => toggleDep(parentOption.id, childOption.id)} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="card border border-base-300 bg-base-100/90 shadow-xl">
            <div className="card-body gap-4">
              <h2 className="card-title">Review</h2>
              <pre className="max-h-[440px] overflow-auto rounded-xl bg-neutral p-4 text-xs text-neutral-content">
                {JSON.stringify(payload, null, 2)}
              </pre>
              <div className="flex justify-end">
                <button className="btn btn-success" onClick={createDraft}>Create Event Draft</button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="card border border-base-300 bg-base-100/90 shadow-sm">
          <div className="card-body flex flex-row items-center justify-between gap-3 py-3">
            <button className="btn btn-outline" onClick={() => setStep((prev) => Math.max(prev - 1, 0))} disabled={step === 0}>Back</button>
            <button
              className={`btn btn-primary ${!canContinue || step === STEPS.length - 1 ? "btn-disabled" : ""}`}
              onClick={() => {
                if (!canContinue) {
                  toast.error("Please complete this step first.");
                  return;
                }
                setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
              }}
              disabled={!canContinue || step === STEPS.length - 1}
            >
              Continue
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EventSetupStudio;
