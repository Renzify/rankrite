import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";

export default function EventInfoTab() {
  const {
    isCatalogLoading,
    selectedEventType,
    selectedSport,
    formValues,
    eventTypeOptions,
    sportOptions,
    selectableFields,
    setSelectedEventType,
    setSelectedSport,
    updateFieldValue,
    getFilteredOptions,
  } = useOutletContext();

  const [isEditing, setIsEditing] = useState(false);

  const eventTypeLabel =
    eventTypeOptions.find((option) => option.value === selectedEventType)
      ?.label || "--";
  const sportLabel =
    sportOptions.find((option) => option.value === selectedSport)?.label || "--";

  const displayFields = useMemo(
    () =>
      selectableFields.map((field) => {
        const value = formValues[field.key];
        if (value === undefined || value === null || value === "") {
          return { field, display: "--" };
        }

        const option = (field.options ?? []).find((opt) => opt.value === value);
        return { field, display: option?.label ?? String(value) };
      }),
    [formValues, selectableFields],
  );

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          {isEditing ? "Edit Event Info" : "Event Info"}
        </h2>
        <button
          type="button"
          className={`btn btn-sm ${isEditing ? "btn-outline" : "btn-primary"}`}
          onClick={() => setIsEditing((prev) => !prev)}
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      {!isEditing ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                Event Type
              </p>
              <p className="mt-2 text-sm font-semibold">{eventTypeLabel}</p>
            </div>
            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                Sport
              </p>
              <p className="mt-2 text-sm font-semibold">{sportLabel}</p>
            </div>
          </div>

          <div className="rounded-xl border border-base-300 bg-base-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
              Event Title
            </p>
            <p className="mt-2 text-sm font-semibold">
              {formValues.eventTitle || "--"}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
              Selected Fields
            </h3>
            {displayFields.length === 0 ? (
              <div className="alert border border-base-300 bg-base-200/60 text-base-content">
                <span>No selectable fields yet.</span>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {displayFields.map(({ field, display }) => (
                  <div
                    key={field.id}
                    className="rounded-xl border border-base-300 bg-base-100 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                      {field.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{display}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Event Type</span>
              </div>
              <select
                className={`select select-bordered w-full ${isCatalogLoading ? "select-disabled" : ""}`}
                value={selectedEventType}
                onChange={(event) => setSelectedEventType(event.target.value)}
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
                <span className="label-text font-semibold">Sport</span>
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

          <label className="form-control w-full">
            <div className="label pb-1">
              <span className="label-text font-semibold">Event Title</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formValues.eventTitle || ""}
              onChange={(event) =>
                updateFieldValue("eventTitle", event.target.value)
              }
            />
          </label>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70 mt-5">
              Selected Fields
            </h3>
            {selectableFields.length === 0 ? (
              <div className="alert border border-base-300 bg-base-200/60 text-base-content">
                <span>
                  No selectable fields yet. Select event type and sport first.
                </span>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {selectableFields.map((field) => {
                  const options = getFilteredOptions(field);

                  return (
                    <label key={field.id} className="form-control w-full">
                      <div className="label pb-1">
                        <span className="label-text font-semibold">
                          {field.label}
                        </span>
                      </div>
                      <select
                        className={`select select-bordered w-full ${options.length === 0 ? "select-disabled" : ""}`}
                        value={formValues[field.key] || ""}
                        onChange={(event) =>
                          updateFieldValue(field.key, event.target.value)
                        }
                        disabled={options.length === 0}
                      >
                        <option value="">-- Select {field.label} --</option>
                        {options.map((option) => (
                          <option key={option.id} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
