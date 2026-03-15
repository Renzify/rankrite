import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";
import { useEventStore } from "../../../stores/eventStore";

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

export function useDashboardPage() {
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

  return {
    deletingEventId,
    error,
    eventPendingDelete,
    filteredEvents,
    handleCloseDeleteModal,
    handleCreateEvent,
    handleDeleteEvent,
    handleOpenDeleteModal,
    handleOpenEvent,
    isLoading,
    setStatusFilter,
    statusFilter,
    statusOptions: STATUS_OPTIONS,
    statisticsEvents: displayEvents,
  };
}
