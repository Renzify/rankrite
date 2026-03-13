import { useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  ListOrdered,
  Search,
} from "lucide-react";
import ActivityLogTable from "../components/ActivityLogTable";
import { DropdownMenu } from "../layouts/helpers/Dropdown";

const ACTIVITY_LOGS = [
  {
    id: 1,
    action: "Login",
    user: "Admin",
    details: "Logged into the system",
    timestamp: "2026-01-17 14:30:00",
  },
  {
    id: 2,
    action: "Create Event",
    user: "Admin",
    details: "Created new event: Regional Dance Competition",
    timestamp: "2026-01-16 08:15:00",
  },
  {
    id: 3,
    action: "Update Score",
    user: "Judge 1",
    details: "Updated score for Contestant #5",
    timestamp: "2026-01-18 11:45:00",
  },
  {
    id: 4,
    action: "Add Contestant",
    user: "Admin",
    details: "Added new contestant: Juan Dela Cruz",
    timestamp: "2026-01-15 09:20:00",
  },
  {
    id: 5,
    action: "Export Results",
    user: "Admin",
    details: "Exported scoring results to PDF",
    timestamp: "2026-01-19 16:00:00",
  },
  {
    id: 6,
    action: "Login",
    user: "Judge 2",
    details: "Logged into the system",
    timestamp: "2026-01-16 12:00:00",
  },
  {
    id: 7,
    action: "Update Contestant",
    user: "Admin",
    details: "Updated contestant details: Marky Mark",
    timestamp: "2026-01-17 08:30:00",
  },
  {
    id: 8,
    action: "Delete Event",
    user: "Admin",
    details: "Deleted event: Test Event 2025",
    timestamp: "2026-01-15 14:00:00",
  },
  {
    id: 9,
    action: "Login",
    user: "Judge 3",
    details: "Logged into the system",
    timestamp: "2026-01-18 07:00:00",
  },
  {
    id: 10,
    action: "Update Score",
    user: "Judge 1",
    details: "Updated score for Contestant #12",
    timestamp: "2026-01-16 15:30:00",
  },
  {
    id: 11,
    action: "Create Event",
    user: "Admin",
    details: "Created new event: Swimming Competition 2026",
    timestamp: "2026-01-19 10:00:00",
  },
  {
    id: 12,
    action: "Add Contestant",
    user: "Admin",
    details: "Added new contestant: Maria Garcia",
    timestamp: "2026-01-15 11:15:00",
  },
  {
    id: 13,
    action: "Login",
    user: "Judge 1",
    details: "Logged into the system",
    timestamp: "2026-01-18 13:00:00",
  },
  {
    id: 14,
    action: "Update Score",
    user: "Judge 2",
    details: "Updated score for Contestant #8",
    timestamp: "2026-01-17 09:30:00",
  },
];

const FILTER_OPTIONS = [
  { value: "all", label: "All activity" },
  { value: "event", label: "Events" },
  { value: "contestant", label: "Contestants" },
  { value: "scoring", label: "Scoring" },
  { value: "auth", label: "Sign-ins" },
  { value: "reports", label: "Exports" },
];

const ACTION_GROUPS = {
  Login: "auth",
  "Create Event": "event",
  "Delete Event": "event",
  "Add Contestant": "contestant",
  "Update Contestant": "contestant",
  "Update Score": "scoring",
  "Export Results": "reports",
};

const sortByNewest = (left, right) =>
  new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();

function ActivityLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const filterDropdownRef = useRef(null);
  const itemsPerPage = 10;

  const currentFilterLabel =
    FILTER_OPTIONS.find((option) => option.value === selectedFilter)?.label ||
    "All activity";

  const filteredActivities = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return ACTIVITY_LOGS.filter((activity) => {
      const matchesFilter =
        selectedFilter === "all" ||
        ACTION_GROUPS[activity.action] === selectedFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        activity.action,
        activity.user,
        activity.details,
        activity.timestamp,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    }).sort(sortByNewest);
  }, [searchQuery, selectedFilter]);

  const filteredCount = filteredActivities.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = safeCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = filteredActivities.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handleFilterChange = (filterValue) => {
    setSelectedFilter(filterValue);
    setCurrentPage(1);
    filterDropdownRef.current?.close();
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const totalActivities = ACTIVITY_LOGS.length;
  const hasSearch = searchQuery.trim().length > 0;
  const countLabel =
    filteredCount === totalActivities
      ? `${totalActivities} activities`
      : `${filteredCount} of ${totalActivities} activities`;
  const countCaption =
    hasSearch || selectedFilter !== "all"
      ? "Matching your current search and filter."
      : "Newest activity appears first.";
  const visibleStart = filteredCount ? indexOfFirstItem + 1 : 0;
  const visibleEnd = filteredCount
    ? Math.min(indexOfLastItem, filteredCount)
    : 0;
  const showPagination = filteredCount > itemsPerPage;

  return (
    <div className="app-page app-page-wide">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-7xl">
          <section className="app-surface mb-5">
            <div className="app-section">
              <div className="flex items-center gap-2">
                <h1 className="app-page-title">Activity Log</h1>
                <div
                  className="ml-1 tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200"
                  data-tip="Activity Log: View the record of actions made in the system. It helps you track recent activity and review important changes."
                >
                  ?
                </div>
              </div>
              <p className="app-page-subtitle">
                Review actions across sign-ins, event management, scoring, and
                exports.
              </p>
            </div>
          </section>

          <section className="app-surface mb-5">
            <div className="app-section">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200/40 px-4 py-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ListOrdered size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{countLabel}</p>
                    <p className="text-xs text-base-content/60">
                      {countCaption}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                  <label className="relative w-full xl:min-w-[360px]">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10 text-base-content/60"
                    />
                    <input
                      type="text"
                      placeholder="Search activity history..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="input input-bordered w-full pl-10"
                    />
                  </label>

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
                          {currentFilterLabel}
                        </span>
                      </button>
                    )}
                  >
                    {FILTER_OPTIONS.map((option) => (
                      <li key={option.value}>
                        <button
                          type="button"
                          onClick={() => handleFilterChange(option.value)}
                          className={`rounded-md ${selectedFilter === option.value ? "bg-primary text-primary-content" : ""}`}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </section>

          <div className="app-surface">
            <ActivityLogTable activities={currentActivities} />
          </div>

          {showPagination && (
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="text-sm text-base-content/60">
                Showing {visibleStart}-{visibleEnd} of {filteredCount}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="btn btn-sm btn-outline gap-1"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className="btn btn-sm btn-outline gap-1"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityLog;
