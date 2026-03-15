import { useRef } from "react";
import { Filter } from "lucide-react";
import { DropdownMenu } from "../../../layouts/helpers/Dropdown";

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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Event
        </button>

        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
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
                  className={`w-full rounded-md text-left ${statusFilter === status ? "bg-primary text-primary-content" : ""}`}
                >
                  {status}
                </button>
              </li>
            ))}
          </DropdownMenu>

          <div className="mb-1 flex w-full justify-end"></div>
        </div>
      </div>
    </section>
  );
}

export default AddEvent;
