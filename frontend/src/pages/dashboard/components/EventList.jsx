import StatusBadge from "../../../shared/utils/StatusBadge";

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
      <table className="table table-zebra min-w-[760px]">
        <thead>
          <tr>
            <th>#</th>
            <th>Event Name</th>
            <th className="w-36 px-6">Status</th>
            <th className="w-40 px-6">Created</th>
            <th className="flex w-44 items-center justify-center gap-1 text-center">
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

export default EventList;
