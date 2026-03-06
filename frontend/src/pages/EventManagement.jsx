import { useState } from "react";
import { useNavigate } from "react-router";
import { useEventStore } from "../stores/eventStore";
import toast from "react-hot-toast";

function EventManagement() {
  const navigate = useNavigate();
  const { events, getStatusInfo, deleteEvent, setSelectedEvent } =
    useEventStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewEvent = (eventId) => {
    setSelectedEvent(eventId);
    navigate(`/events/${eventId}`);
  };

  const handleDeleteEvent = (eventId) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEvent(eventId);
      toast.success("Event deleted");
    }
  };

  const getStatusBadge = (status) => {
    const { label, color } = getStatusInfo(status);
    return <span className={`badge ${color}`}>{label}</span>;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-indigo-300/40 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <section className="card border border-base-300 bg-gradient-to-br from-slate-900 via-blue-800 to-violet-600 text-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">
              Event Management
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Manage Events
            </h1>
            <p className="mt-2 max-w-3xl text-sm opacity-95 md:text-base">
              View, edit, and manage all your events in one place.
            </p>

            <div className="stats stats-vertical mt-4 border border-white/30 bg-white/10 shadow-none sm:stats-horizontal">
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Total Events</div>
                <div className="stat-value text-2xl text-base-100">
                  {events.length}
                </div>
              </div>
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">On Going</div>
                <div className="stat-value text-2xl text-base-100">
                  {events.filter((e) => e.status === "ongoing").length}
                </div>
              </div>
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">To Be Held</div>
                <div className="stat-value text-2xl text-base-100">
                  {events.filter((e) => e.status === "to_be_held").length}
                </div>
              </div>
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Finished</div>
                <div className="stat-value text-2xl text-base-100">
                  {events.filter((e) => e.status === "finished").length}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="card border border-base-300 bg-base-100/90 shadow-sm">
          <div className="card-body flex flex-row items-center gap-4 py-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search events..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="to_be_held">To Be Held</option>
              <option value="ongoing">On Going</option>
              <option value="finished">Finished</option>
            </select>
          </div>
        </section>

        {/* Events Table */}
        <section className="card border border-base-300 bg-base-100/90 shadow-xl">
          <div className="card-body gap-0">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-lg text-base-content/60">No events found</p>
                <p className="text-sm text-base-content/40">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Template</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="hover">
                        <td>
                          <div className="font-semibold">{event.title}</div>
                          <div className="text-xs text-base-content/60">
                            {event.sport}
                          </div>
                        </td>
                        <td>{event.templateName}</td>
                        <td>{getStatusBadge(event.status)}</td>
                        <td>
                          {new Date(event.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleViewEvent(event.id)}
                            >
                              View/Edit
                            </button>
                            <button
                              className="btn btn-sm btn-error btn-outline"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default EventManagement;
