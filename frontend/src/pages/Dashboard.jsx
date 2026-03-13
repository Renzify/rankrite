import { useEffect, useMemo, useRef, useState } from "react";
import { Filter } from "lucide-react";
import { DropdownMenu } from "../helpers/Dropdown";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
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
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [eventPendingDelete, setEventPendingDelete] = useState(null);
  const { events, isLoading, error, loadEvents, deleteEvent } = useEventStore(
    useShallow((state) => ({
      events: state.events,
      isLoading: state.isLoading,
      error: state.error,
      loadEvents: state.loadEvents,
      deleteEvent: state.deleteEvent,
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

  const handleOpenEvent = (eventId) => {
    if (!eventId) return;
    navigate(`/events/${eventId}`);
  };

  const handleOpenDeleteModal = (event) => {
    if (!event?.id || deletingEventId) return;
    setEventPendingDelete(event);
  };

  const handleCloseDeleteModal = () => {
    if (deletingEventId) return;
    setEventPendingDelete(null);
  };

  const handleDeleteEvent = async () => {
    const eventId = eventPendingDelete?.id;
    if (!eventId || deletingEventId) return;

    setDeletingEventId(eventId);

    try {
      await deleteEvent(eventId);
      toast.success("Event deleted");
      setEventPendingDelete(null);
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        (error instanceof Error ? error.message : "Failed to delete event.");
      toast.error(message);
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <div className="app-page space-y-6">
      <section>
        <div className="flex items-center justify-start mb-2">
          <h1 className="app-page-title">Manage Events</h1>
          <div
            className="t3 tooltip tooltip-warning tooltip-right z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200 ml-2"
            data-tip="Page Overview: This page helps you manage events and access their main functions. It is the starting point for creating, opening, and managing event records."
          >
            ?
          </div>
        </div>
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

      {/* <div className="w-full flex justify-end mb-1">
        <div
          className=" t2 tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200 mr-5"
          data-tip="View Button: Open event details and manage contestants, judges, scoring, and display settings. Delete Button: Permanently remove the event and all related data."
        >
          ?
        </div>
      </div> */}

      <EventList
        events={filteredEvents}
        isLoading={isLoading}
        error={error}
        deletingEventId={deletingEventId}
        onOpenEvent={handleOpenEvent}
        onDeleteEvent={handleOpenDeleteModal}
      />

      <DeleteEventModal
        event={eventPendingDelete}
        isDeleting={deletingEventId === eventPendingDelete?.id}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteEvent}
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

function AddEvent({
  statusFilter,
  setStatusFilter,
  statusOptions,
  onAddEvent,
}) {
  const filterDropdownRef = useRef(null);

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    filterDropdownRef.current?.close();
  };

  const currentLabel = statusFilter;

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

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <DropdownMenu
            ref={filterDropdownRef}
            menuClassName="menu mt-2 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
            trigger={({ toggle, isOpen }) => (
              <button
                type="button"
                className={`btn btn-outline w-full justify-between gap-2 sm:w-auto ${isOpen ? "btn-active" : ""}`}
                onClick={toggle}
              >
                <Filter size={18} className="text-base-content/60" />
                <span className="whitespace-nowrap font-medium text-xs">
                  {currentLabel}
                </span>
              </button>
            )}
          >
            {statusOptions.map((status) => (
              <li key={status}>
                <button
                  type="button"
                  onClick={() => handleFilterChange(status)}
                  className={`rounded-md w-full text-left ${statusFilter === status ? "bg-primary text-primary-content" : ""}`}
                >
                  {status}
                </button>
              </li>
            ))}
          </DropdownMenu>
          <div className="w-full flex justify-end mb-1">
            {/* <div
              className="t1 tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200 ml-2"
              data-tip="Click 'Add Event' to create new events. Use the filter dropdown to view events by status (Draft, Live, Finished, etc.)."
            >
              ?
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
}

function EventList({
  events,
  isLoading,
  error,
  deletingEventId,
  onOpenEvent,
  onDeleteEvent,
}) {
  return (
    <section className="app-table-wrap relative">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>#</th>
            <th>Event Name</th>
            <th className="w-36 px-6">Status</th>
            <th className="w-40 px-6">Created</th>
            <th className="flex items-center gap-1 justify-center w-44 text-center">
              Actions
            </th>
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
                      onClick={() => onOpenEvent(event.id)}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline w-16 justify-center hover:border-error hover:bg-error hover:text-error-content"
                      onClick={() => onDeleteEvent(event)}
                      disabled={deletingEventId === event.id}
                    >
                      {deletingEventId === event.id ? "..." : "Delete"}
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

function DeleteEventModal({ event, isDeleting, onClose, onConfirm }) {
  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-base-300 bg-base-100 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Delete Event</h3>
            <p className="text-sm text-base-content/70">{event.name}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-base-content/80">
          <p>This will permanently remove the event and its related records.</p>
          <p>The action cannot be undone.</p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-error btn-sm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Event"}
          </button>
        </div>
      </div>
    </div>
  );
}
