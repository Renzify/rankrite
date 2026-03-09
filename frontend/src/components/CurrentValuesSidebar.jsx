function CurrentValuesSidebar({
  selectedEventType,
  selectedSport,
  eventTitle,
  template,
  visibleFields,
  formValues,
}) {
  return (
    <aside className="card border border-base-300 bg-base-100/90 shadow-lg">
      <div className="card-body gap-4">
        <h3 className="card-title text-lg">Current Values</h3>

        <div className="stats stats-vertical border border-base-300 bg-base-200/40 shadow-none">
          <div className="stat py-3">
            <div className="stat-title">Event Title</div>
            <div className="stat-value text-base">{eventTitle || "-"}</div>
          </div>
          <div className="stat py-3">
            <div className="stat-title">Event Type</div>
            <div className="stat-value text-base">
              {selectedEventType || "-"}
            </div>
          </div>
          <div className="stat py-3">
            <div className="stat-title">Sport</div>
            <div className="stat-value text-base">{selectedSport || "-"}</div>
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
  );
}

export default CurrentValuesSidebar;
