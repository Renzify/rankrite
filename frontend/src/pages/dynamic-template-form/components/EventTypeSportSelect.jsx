function EventTypeSportSelect({
  selectedEventType,
  selectedSport,
  isCatalogLoading,
  eventTypeOptions,
  sportOptions,
  eventTitle,
  setSelectedEventType,
  setSelectedSport,
  handleEventTitleChange,
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="form-control w-full">
          <div className="label pb-1">
            <span className="label-text font-semibold">Select Event Type</span>
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
            <span className="label-text font-semibold">Select Sport</span>
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

      {/* Event Title Input - Shown when sport is selected */}
      {selectedSport ? (
        <label className="form-control w-full">
          <div className="label pb-1">
            <span className="label-text font-semibold">Event Title</span>
          </div>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g. Regional Gymnastics Championship 2024"
            value={eventTitle}
            onChange={handleEventTitleChange}
          />
        </label>
      ) : null}
    </>
  );
}

export default EventTypeSportSelect;
