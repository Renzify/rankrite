import { MoveLeft } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { formatEventStatusLabel } from "./hooks/eventDetailsHelpers";
import { useEventDetailsPage } from "./hooks/useEventDetailsPage";

const TAB_LINKS = [
  { to: "event-info", label: "Event Info" },
  { to: "judges", label: "Judges" },
  { to: "contestant", label: "Contestants" },
  { to: "scoring", label: "Scoring" },
  { to: "display-control", label: "Display Control" },
];

function getStatusMessage(currentEventStatus, isDraftToBeHeldRestricted) {
  if (currentEventStatus === "draft") {
    return {
      toneClassName: isDraftToBeHeldRestricted
        ? "text-warning"
        : "text-base-content/70",
      text: isDraftToBeHeldRestricted
        ? "Complete event details and add at least 1 judge and 1 contestant to move this event out of Draft."
        : "This event will move to To Be Held automatically once it is ready.",
    };
  }

  if (currentEventStatus === "to_be_held") {
    return {
      toneClassName: "text-base-content/70",
      text: "This event is ready. Use Go Live when judging should begin.",
    };
  }

  if (currentEventStatus === "live") {
    return {
      toneClassName: "text-base-content/70",
      text: "Move the event back to To Be Held to pause it, or finish it once judging and scoring are complete.",
    };
  }

  return null;
}

export default function EventDetails() {
  const {
    currentEventPhaseId,
    currentEventStatus,
    eventPhases,
    eventStatusBadgeClass,
    eventTitle,
    handleBackToDashboard,
    handleCurrentPhaseChange,
    handleEventStatusChange,
    isDraftToBeHeldRestricted,
    isLoading,
    isUpdatingCurrentPhase,
    isUpdatingEventStatus,
    loadError,
    manualEventStatusActions,
    outletContext,
    pendingEventStatusAction,
  } = useEventDetailsPage();

  const statusMessage = getStatusMessage(
    currentEventStatus,
    isDraftToBeHeldRestricted,
  );

  if (isLoading) {
    return (
      <div className="app-page app-page-wide">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm font-medium text-base-content/70">
            Loading event
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-page app-page-wide space-y-5">
        <section className="app-surface">
          <div className="app-section">
            <p className="text-sm text-error">{loadError}</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app-page app-page-wide space-y-5">
      <div>
        <button
          className="btn btn-neutral btn-soft w-full text-sm hover:bg-neutral/80 sm:w-auto"
          onClick={handleBackToDashboard}
        >
          <MoveLeft /> Back to Events
        </button>
      </div>

      <section className="app-surface">
        <div className="app-section">
          <div className="min-w-0 space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                Event Details
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                {eventTitle}
              </h1>
            </div>

            <div className="flex flex-col gap-3 sm:max-w-[320px]">
              {eventPhases.length ? (
                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">
                      Current Apparatus
                    </span>
                  </div>
                  <select
                    className="select select-bordered w-full"
                    value={currentEventPhaseId}
                    onChange={(event) =>
                      handleCurrentPhaseChange(event.target.value)
                    }
                    disabled={isUpdatingCurrentPhase}
                  >
                    {eventPhases.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.optionLabel ?? phase.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {currentEventStatus ? (
                <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                    Event Status
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`badge badge-lg ${eventStatusBadgeClass}`}>
                      {formatEventStatusLabel(currentEventStatus)}
                    </span>
                    {isUpdatingEventStatus && !pendingEventStatusAction ? (
                      <span className="inline-flex items-center gap-2 text-xs text-base-content/60">
                        <span className="loading loading-spinner loading-xs" />
                        Updating status
                      </span>
                    ) : null}
                  </div>

                  {statusMessage ? (
                    <p className={`mt-3 text-xs ${statusMessage.toneClassName}`}>
                      {statusMessage.text}
                    </p>
                  ) : null}

                  {manualEventStatusActions.length ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-base-content/50">
                        Actions
                      </p>
                      <div className="grid gap-2">
                        {manualEventStatusActions.map((statusAction) => {
                          const StatusActionIcon = statusAction.icon;
                          const isPendingAction =
                            pendingEventStatusAction === statusAction.nextStatus;

                          return (
                            <button
                              key={statusAction.nextStatus}
                              type="button"
                              className={`w-full rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-base-content/20 disabled:cursor-not-allowed disabled:opacity-70 ${statusAction.toneClassName} ${!isUpdatingEventStatus ? "hover:-translate-y-0.5" : ""}`}
                              onClick={() =>
                                handleEventStatusChange(statusAction.nextStatus)
                              }
                              disabled={isUpdatingEventStatus}
                            >
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 rounded-lg bg-base-100/80 p-2 text-base-content shadow-sm">
                                  {isPendingAction ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : (
                                    <StatusActionIcon className="h-4 w-4" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold text-base-content">
                                    {statusAction.label}
                                  </span>
                                  <span className="mt-1 block text-xs leading-5 text-base-content/70">
                                    {statusAction.description}
                                  </span>
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-x-auto pb-1">
        <div
          className="tabs tabs-boxed w-max min-w-max gap-2 bg-base-200/50 p-1 sm:w-full sm:min-w-0"
          role="tablist"
        >
          {TAB_LINKS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              role="tab"
              className={({ isActive }) =>
                `tab whitespace-nowrap rounded-lg px-3 sm:px-4 ${isActive ? "tab-active" : ""}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      <section className="app-surface">
        <div className="app-section">
          <Outlet context={outletContext} />
        </div>
      </section>
    </div>
  );
}