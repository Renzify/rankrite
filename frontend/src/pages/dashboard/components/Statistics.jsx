import React from "react";

function Statistics({ events }) {
  const totalEvents = events.length;
  const draft = events.filter((event) => event.status === "Draft").length;
  const finished = events.filter((event) => event.status === "Finished").length;

  return (
    <section className="app-surface app-section">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="app-muted-panel text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/60">
            Total Events
          </p>
          <p className="mt-2 text-2xl font-bold">{totalEvents}</p>
        </div>

        <div className="app-muted-panel text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/60">
            Draft
          </p>
          <p className="mt-2 text-2xl font-bold">{draft}</p>
        </div>

        <div className="app-muted-panel text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/60">
            Finished
          </p>
          <p className="mt-2 text-2xl font-bold">{finished}</p>
        </div>
      </div>
    </section>
  );
}

export default Statistics;
