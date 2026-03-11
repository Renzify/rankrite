import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router";
import { useDynamicTemplate } from "../hooks/useDynamicTemplate";
import { getEventDetails } from "../api/eventApi";
import StatusBadge from "../components/StatusBadge";

const TAB_LINKS = [
  { to: "event-info", label: "Event Info" },
  { to: "judges", label: "Judges" },
  { to: "contestant", label: "Contestants" },
  { to: "scoring", label: "Scoring" },
  { to: "display-control", label: "Display Control" },
];

export default function EventDetails() {
  const { eventId } = useParams();
  const {
    isCatalogLoading,
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

  const [judgeFullName, setJudgeFullName] = useState("");
  const [judgeType, setJudgeType] = useState("");
  const [judges, setJudges] = useState([]);
  const [contestants, setContestants] = useState([]);
  const [judgeScores, setJudgeScores] = useState({});
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [pendingFormValues, setPendingFormValues] = useState(null);
  const [didHydrate, setDidHydrate] = useState(false);

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

        setEventDetails(data);
        setSelectedEventType(data.template?.eventType ?? "");
        setSelectedSport(data.formValues?.sport ?? "");
        setJudges(data.judges ?? []);
        setContestants(
          (data.contestants ?? []).map((contestant) => ({
            ...contestant,
            delegation: contestant.teamName ?? "",
          })),
        );

        setPendingFormValues({
          ...data.formValues,
          eventTitle: data.event.title,
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

  const canSubmitJudge = Boolean(judgeFullName.trim() && judgeType);

  const handleJudgeSubmit = (event) => {
    event.preventDefault();
    if (!canSubmitJudge) return;

    const nextJudge = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}_${Math.random()}`,
      fullName: judgeFullName.trim(),
      judgeType,
    };

    setJudges((prev) => [...prev, nextJudge]);
    setJudgeFullName("");
    setJudgeType("");
  };

  if (isLoading) {
    return (
      <div className="app-page app-page-wide space-y-5">
        <section className="app-surface">
          <div className="app-section">
            <p className="text-sm text-base-content/70">Loading event...</p>
          </div>
        </section>
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
              selectedEventType,
              selectedSport,
              formValues,
              eventTypeOptions,
              sportOptions,
              selectableFields,
              setSelectedEventType,
              setSelectedSport,
              updateFieldValue,
              getFilteredOptions,
              eventTitle,
              judgeFullName,
              judgeType,
              judges,
              judgeScores,
              setJudgeScores,
              contestants,
              setContestants,
              setJudgeFullName,
              setJudgeType,
              canSubmitJudge,
              handleJudgeSubmit,
            }}
          />
        </div>
      </section>
    </div>
  );
}
