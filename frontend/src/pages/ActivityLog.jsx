import React, { useState, useRef } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Filter,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import ActivityLogTable from "../components/ActivityLogTable";
import { DropdownMenu } from "../helpers/Dropdown";

function ActivityLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const filterDropdownRef = useRef(null);
  const itemsPerPage = 10;

  // Sample activity log data - expanded to show pagination
  const activities = [
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

  const filterOptions = [
    { value: "all", label: "All Activities" },
    { value: "time", label: "By Time" },
    { value: "user", label: "By User" },
    { value: "action", label: "By Action" },
  ];

  const currentFilterLabel =
    filterOptions.find((f) => f.value === selectedFilter)?.label ||
    "All Activities";

  // Filter and sort activities based on selected filter
  const getFilteredAndSortedActivities = () => {
    let filtered = [...activities];

    // Apply sorting based on selected filter
    switch (selectedFilter) {
      case "time":
        // Sort by timestamp (newest first)
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case "user":
        // Sort by user name
        filtered.sort((a, b) => a.user.localeCompare(b.user));
        break;
      case "action":
        // Sort by action type
        filtered.sort((a, b) => a.action.localeCompare(b.action));
        break;
      default:
        // "all" - no sorting applied, keep original order
        break;
    }

    return filtered;
  };

  const filteredActivities = getFilteredAndSortedActivities();

  // Calculate pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = filteredActivities.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handleFilterChange = (filterValue) => {
    setSelectedFilter(filterValue);
    setCurrentPage(1); // Reset to first page when filter changes
    filterDropdownRef.current?.close();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="app-page app-page-wide">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-7xl">
          {/* Header Section */}
          <section className="app-surface mb-5">
            <div className="app-section">
              {/* Top Row: Back Button and Activity Count */}
              <div className="flex items-center justify-between mb-4">
                {/* Left: Back Button */}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-base-content/70 hover:text-primary transition-colors duration-200"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">Back</span>
                </Link>

                {/* Right: Activity Count Box */}
                <div className="flex items-center gap-2 px-4 py-2 border border-base-300 rounded-lg bg-base-200/50">
                  <ListOrdered size={18} className="text-primary" />
                  <span className="font-semibold text-sm">
                    {activities.length} Activities
                  </span>
                </div>
              </div>

              {/* Bottom Row: Title and Subtitle */}
              <div className="p-2">
                <h1 className="text-5xl font-bold tracking-tight mb-3">
                  Activity Log
                </h1>
                <p className="mt-1 text-sm text-base-content/70">
                  Track all actions and changes in the system
                </p>
              </div>
            </div>
          </section>

          {/* Search and Filter Row */}
          <section className="app-surface mb-5">
            <div className="app-section">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left: Search Bar */}
                <div className="w-full sm:w-96">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3"
                      style={{ top: "50%", transform: "translateY(-50%)" }}
                    />
                    <input
                      type="text"
                      placeholder="Search activity history..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input input-bordered w-full pl-10"
                    />
                  </div>
                </div>

                {/* Right: Filter Dropdown */}
                <div className="w-full sm:w-auto">
                  <DropdownMenu
                    ref={filterDropdownRef}
                    menuClassName="menu mt-2 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
                    trigger={({ toggle, isOpen }) => (
                      <button
                        type="button"
                        className={`btn btn-outline w-full sm:w-auto gap-2 ${isOpen ? "btn-active" : ""}`}
                        onClick={toggle}
                      >
                        <Filter size={18} className="text-base-content/60" />
                        <span className="font-medium">
                          {currentFilterLabel}
                        </span>
                      </button>
                    )}
                  >
                    {filterOptions.map((option) => (
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

          {/* Activity Log Table */}
          <div className="app-surface">
            <ActivityLogTable activities={currentActivities} />
          </div>

          {/* Pagination Controls - Outside the table card */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-sm text-base-content/60">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-sm btn-outline gap-1"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
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
