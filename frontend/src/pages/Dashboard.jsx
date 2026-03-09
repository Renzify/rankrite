import { useMemo, useState } from "react";

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
    <div className="flex flex-col items-center">
      <div className="w-3/4">
        <div>
          <Title />
        </div>
        <div>
          <Statistics events={EVENTS} />
        </div>
        <div>
          <AddEvent
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
          />
        </div>
        <div>
          <EventList events={filteredEvents} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

function Title() {
  return <h1 className="mt-4 text-2xl font-bold">Manage Events</h1>;
}

function Statistics({ events }) {
  const totalEvents = events.length;
  const onGoing = events.filter((event) => event.status === "Live").length;
  const toBeHeld = events.filter((event) => event.status === "Draft").length;

  return (
    <div className="mt-4 grid grid-cols-3 divide-x-4 divide-base-300 rounded-lg border border-base-300 p-4 text-center">
      <div>
        <h2 className="text-lg font-semibold">Total Events</h2>
        <h4 className="text-xl font-medium">{totalEvents}</h4>
      </div>
      <div>
        <h2 className="text-lg font-semibold">On Going</h2>
        <h4 className="text-xl font-medium">{onGoing}</h4>
      </div>
      <div>
        <h2 className="text-lg font-semibold">To be Held</h2>
        <h4 className="text-xl font-medium">{toBeHeld}</h4>
      </div>
    </div>
  );
}

function AddEvent({ statusFilter, setStatusFilter, statusOptions }) {
  return (
    <div className="mt-4 flex justify-between">
      <div>
        <button type="button" className="btn btn-neutral btn-soft">
          Add Event
        </button>
      </div>

      <div>
        <label className="form-control">
          <span className="sr-only">Filter by status</span>
          <select
            className="select select-bordered"
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
    </div>
  );
}

function EventList({ events }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-base-300 p-4">
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
                <td className="px-6">{event.status}</td>
                <td className="px-6">{event.created}</td>
                <td className="w-44">
                  <div className="flex items-center justify-center gap-2">
                    {event.status !== "Finished" ? (
                      <button
                        type="button"
                        className="btn btn-sm w-16 justify-center"
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm w-16 justify-center"
                      >
                        View
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm hover:bg-red-500 hover:text-white w-16 justify-center"
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
    </div>
  );
}
