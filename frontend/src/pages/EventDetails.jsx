import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router";
import toast from "react-hot-toast";
import { useDynamicTemplate } from "../hooks/useDynamicTemplate";
import { getEventDetails, updateEvent } from "../api/eventApi";
import StatusBadge from "../components/StatusBadge";
import { buildEventPayload } from "../lib/eventPayload";

const TAB_LINKS = [
  { to: "event-info", label: "Event Info" },
  { to: "judges", label: "Judges" },
  { to: "contestant", label: "Contestants" },
  { to: "scoring", label: "Scoring" },
  { to: "display-control", label: "Display Control" },
];

function applyLoadedEventDetails(data, actions) {
  actions.setEventDetails(data);
  actions.setSelectedEventType(data.template?.eventType ?? "");
  actions.setSelectedSport(data.formValues?.sport ?? "");
  actions.setJudges(data.judges ?? []);
  actions.setContestants(
    (data.contestants ?? []).map((contestant) => ({
      ...contestant,
      teamName: contestant.teamName ?? contestant.delegation ?? "",
      delegation: contestant.teamName ?? contestant.delegation ?? "",
    })),
  );
  actions.setPendingFormValues({
    ...data.formValues,
    eventTitle: data.event.title,
  });
  actions.setDidHydrate(false);
}

export default function EventDetails() {
  const { eventId } = useParams();
  const {
    isCatalogLoading,
    isTemplateLoading,
    selectedEventType,
    selectedSport,
    formValues,
    eventTypeOptions,
    sportOptions,
    visibleFields,
    template,
    setSelectedEventType,
    setSelectedSport,
    updateFieldValue,
    setFormValues,
    getFilteredOptions,
  } = useDynamicTemplate();

  const [judges, setJudges] = useState([]);
  const [contestants, setContestants] = useState([]);
  const [judgeScores, setJudgeScores] = useState({});
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [pendingFormValues, setPendingFormValues] = useState(null);
  const [didHydrate, setDidHydrate] = useState(false);
  const [isSavingEventInfo, setIsSavingEventInfo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadEvent = async () => {
      if (!eventId) {
        setLoadError("Missing event id.");
        return;
      }
      setIsLoading(true);
      setLoadError(null);
      setDidHydrate(false);
      try {
        const data = await getEventDetails(eventId);
        if (!isMounted) return;

        applyLoadedEventDetails(data, {
          setEventDetails,
          setSelectedEventType,
          setSelectedSport,
          setJudges,
          setContestants,
          setPendingFormValues,
          setDidHydrate,
        });
      } catch (error) {
        if (!isMounted) return;
        console.error(error);
        setLoadError("Failed to load event details.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadEvent();

    return () => {
      isMounted = false;
    };
  }, [eventId, setSelectedEventType, setSelectedSport]);

  useEffect(() => {
    if (!pendingFormValues || !template || didHydrate) return;
    setFormValues(pendingFormValues);
    setDidHydrate(true);
  }, [pendingFormValues, template, didHydrate, setFormValues]);

  const eventTitle =
    eventDetails?.event?.title ||
    formValues.eventTitle ||
    "Event Details";

  const selectableFields = useMemo(
    () => visibleFields.filter((field) => field.fieldType === "select"),
    [visibleFields],
  );

  const handleResetEventInfo = () => {
    if (!eventDetails) return;

    applyLoadedEventDetails(eventDetails, {
      setEventDetails,
      setSelectedEventType,
      setSelectedSport,
      setJudges,
      setContestants,
      setPendingFormValues,
      setDidHydrate,
    });
  };

  const handleSaveEventInfo = async (eventTitleInput) => {
    if (!eventId) {
      toast.error("Missing event id.");
      return false;
    }

    try {
      const payload = buildEventPayload({
        template,
        formValues,
        eventTitle: eventTitleInput,
      });

      setIsSavingEventInfo(true);
      const updatedDetails = await updateEvent(eventId, payload);

      applyLoadedEventDetails(updatedDetails, {
        setEventDetails,
        setSelectedEventType,
        setSelectedSport,
        setJudges,
        setContestants,
        setPendingFormValues,
        setDidHydrate,
      });

      toast.success("Event info updated");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "NO_TEMPLATE_SELECTED") {
          toast.error("No template selected.");
          return false;
        }
        if (error.message === "NO_EVENT_TITLE") {
          toast.error("Please enter an event title.");
          return false;
        }
      }

      console.error("Failed to update event info:", error);
      toast.error("Failed to update event info. Please try again.");
      return false;
    } finally {
      setIsSavingEventInfo(false);
    }
  };

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
      <section className="app-surface">
        <div className="app-section flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
              Event Details
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {eventTitle}
            </h1>
          </div>
          {eventDetails?.event?.status ? (
            <StatusBadge
              status={eventDetails.event.status
                .split("_")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ")}
            />
          ) : null}
        </div>
      </section>

      <div
        className="tabs tabs-boxed w-full gap-2 bg-base-200/50 p-1"
        role="tablist"
      >
        {TAB_LINKS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            role="tab"
            className={({ isActive }) =>
              `tab rounded-lg px-4 ${isActive ? "tab-active" : ""}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <section className="app-surface">
        <div className="app-section">
          <Outlet
            context={{
              isCatalogLoading,
              isTemplateLoading,
              selectedEventType,
              selectedSport,
              formValues,
              eventDetails,
              eventTypeOptions,
              sportOptions,
              selectableFields,
              setSelectedEventType,
              setSelectedSport,
              updateFieldValue,
              getFilteredOptions,
              isSavingEventInfo,
              onResetEventInfo: handleResetEventInfo,
              onSaveEventInfo: handleSaveEventInfo,
              eventTitle,
              judges,
              setJudges,
              judgeScores,
              setJudgeScores,
              contestants,
              setContestants,
            }}
          />
        </div>
      </section>
    </div>
  );
}

