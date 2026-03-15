import ConfirmDeleteModal from "../../shared/components/ConfirmDeleteModal";
import { useDashboardPage } from "./hooks/useDashboardPage";
import Statistics from "./components/Statistics";
import AddEvent from "./components/AddEvent";
import EventList from "./components/EventList";

function Dashboard() {
  const {
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
    statusOptions,
    statisticsEvents,
  } = useDashboardPage();

  return (
    <div className="app-page space-y-6">
      <section>
        <div className="mb-2 flex items-center justify-start">
          <h1 className="app-page-title">Manage Events</h1>
          <div
            className="t3 tooltip tooltip-warning tooltip-right z-[100] ml-2 flex h-[25px] w-[25px] cursor-help items-center justify-center rounded-full border-2 border-warning bg-transparent text-sm font-medium text-warning transition-all duration-200 hover:bg-warning hover:text-warning-content"
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

      <Statistics events={statisticsEvents} />

      <AddEvent
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={statusOptions}
        onAddEvent={handleCreateEvent}
      />

      <EventList
        events={filteredEvents}
        isLoading={isLoading}
        error={error}
        deletingEventId={deletingEventId}
        onOpenEvent={handleOpenEvent}
        onDeleteEvent={handleOpenDeleteModal}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(eventPendingDelete)}
        title="Delete Event"
        name={eventPendingDelete?.name ?? ""}
        descriptionLines={[
          "This will permanently remove the event and its related records.",
          "The action cannot be undone.",
        ]}
        confirmLabel="Delete Event"
        isDeleting={deletingEventId === eventPendingDelete?.id}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteEvent}
      />
    </div>
  );
}

export default Dashboard;
