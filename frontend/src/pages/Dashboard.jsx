import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import StatusBadge from "../components/StatusBadge";
import { useEventStore } from "../stores/eventStore";
import { useShallow } from "zustand/react/shallow";

const STATUS_OPTIONS = [
  "All Status",
  "Draft",
  "To Be Held",
  "Live",
  "Finished",
];
const STATUS_LABELS = {
  draft: "Draft",
  live: "Live",
  finished: "Finished",
  to_be_held: "To Be Held",
};

const formatStatus = (status) => {
  if (!status) return "Unknown";
  const normalized = status.toLowerCase();
  return (
    STATUS_LABELS[normalized] ??
    `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
  );
};

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

function Dashboard() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All Status");
  const { events, isLoading, error, loadEvents } = useEventStore(
    useShallow((state) => ({
      events: state.events,
      isLoading: state.isLoading,
      error: state.error,
      loadEvents: state.loadEvents,
    })),
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const displayEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        name: event.title,
        status: formatStatus(event.status),
        created: formatDate(event.createdAt),
      })),
    [events],
  );

  const filteredEvents = useMemo(() => {
    if (statusFilter === "All Status") {
      return displayEvents;
    }

    return displayEvents.filter((event) => event.status === statusFilter);
  }, [displayEvents, statusFilter]);

  const handleCreateEvent = () => {
    navigate("/event-form");
  };

  const handleOpenEvent = () => {
    navigate("/events/details");
  };

  return (
    <div className="app-page space-y-6">
      <section>
        <h1 className="app-page-title">Manage Events</h1>
        <p className="app-page-subtitle">
          Review event lifecycle, monitor status, and manage actions in one
          place.
        </p>
      </section>

      <Statistics events={displayEvents} />

      <AddEvent
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        onAddEvent={handleCreateEvent}
      />

      <EventList
        events={filteredEvents}
        isLoading={isLoading}
        error={error}
        onOpenEvent={handleOpenEvent}
      />
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

function AddEvent({ statusFilter, setStatusFilter, statusOptions, onAddEvent }) {
  return (
    <section className="app-surface app-section">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="btn btn-primary w-full sm:w-auto"
          onClick={onAddEvent}
        >
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

function EventList({ events, isLoading, error, onOpenEvent }) {
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
          {isLoading ? (
            <tr className="transition-colors hover:bg-base-200">
              <td colSpan={5} className="text-center text-base-content/60">
                Loading events...
              </td>
            </tr>
          ) : error ? (
            <tr className="transition-colors hover:bg-base-200">
              <td colSpan={5} className="text-center text-error">
                {error}
              </td>
            </tr>
          ) : events.length ? (
            events.map((event, index) => (
              <tr key={event.id} className="transition-colors hover:bg-base-200">
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
                      onClick={onOpenEvent}
                    >
                      View
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
