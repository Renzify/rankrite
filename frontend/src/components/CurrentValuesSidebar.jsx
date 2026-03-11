function CurrentValuesSidebar({
  selectedEventType,
  selectedSport,
  eventTitle,
  template,
  visibleFields,
  formValues,
  currentTab,
  judges,
  contestants,
}) {
  const formatContestantMeta = (contestant) => {
    const parts = [];
    const delegation = contestant.delegation || contestant.teamName;

    if (delegation) parts.push(`Team: ${delegation}`);
    if (contestant.gender) parts.push(`Gender: ${contestant.gender}`);

    return parts.join(" - ");
  };

  return (
    <aside className="app-surface-soft">
      <div className="app-section space-y-4">
        {currentTab === "details" && (
          <>
            <h3 className="text-lg font-semibold tracking-tight">Current Values</h3>

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
          </>
        )}

        {currentTab === "judges" && (
          <>
            <h3 className="text-lg font-semibold tracking-tight">
              Added Judges ({judges.length})
            </h3>

            {judges.length > 0 ? (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {judges.map((judge) => (
                  <div
                    key={judge.id}
                    className="rounded-xl border border-base-300 bg-base-100 p-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{judge.fullName}</p>
                        <p className="text-sm text-base-content/60">
                          {judge.judgeType}
                          {judge.judgeNumber ? ` - Judge #${judge.judgeNumber}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info">
                <span>No judges added yet.</span>
              </div>
            )}
          </>
        )}

        {currentTab === "contestants" && (
          <>
            <h3 className="text-lg font-semibold tracking-tight">
              Added Contestants ({contestants.length})
            </h3>

            {contestants.length > 0 ? (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {contestants.map((contestant, index) => (
                  <div
                    key={contestant.id}
                    className="rounded-xl border border-base-300 bg-base-100 p-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">
                          #{index + 1} - {contestant.fullName}
                        </p>
                        <p className="text-sm text-base-content/60">
                          {formatContestantMeta(contestant)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info">
                <span>No contestants added yet.</span>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

export default CurrentValuesSidebar;
