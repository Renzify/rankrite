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

function FormStages({ selectedEventType, selectedSport }) {
  const activeStageIndex = getActiveStageIndex(
    selectedEventType,
    selectedSport,
  );

  return (
    <section className="card border border-base-300 bg-base-100/90 shadow-sm">
      <div className="card-body gap-2">
        <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {STAGES.map((stage, index) => {
            const isActive = activeStageIndex === index;
            const isConnectorActive =
              index < STAGES.length - 1 &&
              (activeStageIndex === index || activeStageIndex === index + 1);

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
  );
}

export default FormStages;
