import { useMemo, useState } from "react";
import StatusBadge from "../components/StatusBadge";

const EVENTS = [
  {
    id: 1,
    name: "Sports",
    status: "Draft",
    created: "12/20/2025",
  },
  {
    id: 2,
    name: "Hart Hagerty",
    status: "Live",
    created: "12/20/2025",
  },
  {
    id: 3,
    name: "Brice Swyre",
    status: "Finished",
    created: "12/20/2025",
  },
  {
    id: 4,
    name: "Gymnastics Open",
    status: "Live",
    created: "01/14/2026",
  },
];

const STATUS_OPTIONS = ["All Status", "Draft", "Live", "Finished"];

function Dashboard() {
  const [statusFilter, setStatusFilter] = useState("All Status");

  const filteredEvents = useMemo(() => {
    if (statusFilter === "All Status") {
      return EVENTS;
    }

    return EVENTS.filter((event) => event.status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="app-page space-y-6">
      <section>
        <h1 className="app-page-title">Manage Events</h1>
        <p className="app-page-subtitle">
          Review event lifecycle, monitor status, and manage actions in one
          place.
        </p>
      </section>

      <Statistics events={EVENTS} />

      <AddEvent
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
      />

      <EventList events={filteredEvents} />
    </div>
  );
}

export default Dashboard;

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

function AddEvent({ statusFilter, setStatusFilter, statusOptions }) {
  return (
    <section className="app-surface app-section">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" className="btn btn-primary w-full sm:w-auto">
          Add Event
        </button>

        <label className="form-control w-full sm:w-56">
          <span className="sr-only">Filter by status</span>
          <select
            className="select select-bordered w-full"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function EventList({ events }) {
  return (
    <section className="app-table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Event Name</th>
            <th className="w-36 px-6">Status</th>
            <th className="w-40 px-6">Created</th>
            <th className="w-44 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {events.length ? (
            events.map((event, index) => (
              <tr
                key={event.id}
                className="transition-colors hover:bg-base-200"
              >
                <th>{index + 1}</th>
                <td>{event.name}</td>
                <td className="px-6">
                  <StatusBadge status={event.status} />
                </td>
                <td className="px-6">{event.created}</td>
                <td className="w-44">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline w-16 justify-center"
                    >
                      {event.status !== "Finished" ? "Edit" : "View"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline w-16 justify-center hover:border-error hover:bg-error hover:text-error-content"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr className="transition-colors hover:bg-base-200">
              <td colSpan={5} className="text-center text-base-content/60">
                No events found for this status.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
