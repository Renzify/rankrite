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

  return (
    <div className="w-full space-y-5">
      <h2 className="text-lg font-semibold">Edit Event Info</h2>

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
          value={formValues.eventTitle || "Gymnastics Regional 2024"}
          onChange={(event) => updateFieldValue("eventTitle", event.target.value)}
        />
      </label>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
          Selected Fields
        </h3>
        {selectableFields.length === 0 ? (
          <div className="alert border border-base-300 bg-base-200/60 text-base-content">
            <span>No selectable fields yet. Select event type and sport first.</span>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {selectableFields.map((field) => {
              const options = getFilteredOptions(field);

              return (
                <label key={field.id} className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">{field.label}</span>
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
    </div>
  );
}
