import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useDynamicTemplate } from "../dynamic-template-form/hooks/useDynamicTemplate";
import {
  addEventContestant,
  addEventJudge,
  deleteEventContestant,
  deleteEventJudge,
  getEventDetails,
  importEventContestants,
  updateEvent,
  updateEventJudge,
  updateEventContestant,
} from "../../api/eventApi";
import StatusBadge from "../../shared/utils/StatusBadge";
import { buildEventPayload } from "../../lib/eventPayload";
import { MoveLeft } from "lucide-react";

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
  actions.setContestants((data.contestants ?? []).map(mapContestantForForm));
  actions.setPendingFormValues({
    ...data.formValues,
    eventTitle: data.event.title,
  });
  actions.setDidHydrate(false);
}

function mapContestantForForm(contestant) {
  return {
    ...contestant,
    teamName: contestant.teamName ?? contestant.delegation ?? "",
    delegation: contestant.teamName ?? contestant.delegation ?? "",
  };
}

function getApiErrorMessage(error, fallbackMessage) {
  const responseMessage = error?.response?.data?.message;

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
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
  const [isSavingJudge, setIsSavingJudge] = useState(false);
  const [isSavingContestant, setIsSavingContestant] = useState(false);

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
    eventDetails?.event?.title || formValues.eventTitle || "Event Details";

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

  const handleCreateJudge = async (judgeInput) => {
    if (!eventId) {
      toast.error("Missing event id.");
      throw new Error("MISSING_EVENT_ID");
    }

    try {
      setIsSavingJudge(true);
      const createdJudge = await addEventJudge(eventId, judgeInput);

      setJudges((prev) => [...prev, createdJudge]);
      setEventDetails((prev) =>
        prev
          ? {
              ...prev,
              judges: [...(prev.judges ?? []), createdJudge],
            }
          : prev,
      );

      toast.success("Judge added");
      return createdJudge;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to add judge.");
      console.error("Failed to add judge:", error);
      toast.error(message);
      throw error;
    } finally {
      setIsSavingJudge(false);
    }
  };

  const handleUpdateJudge = async (judgeId, judgeInput) => {
    if (!eventId) {
      toast.error("Missing event id.");
      throw new Error("MISSING_EVENT_ID");
    }

    try {
      setIsSavingJudge(true);
      const updatedJudge = await updateEventJudge(eventId, judgeId, judgeInput);

      setJudges((prev) =>
        prev.map((judge) => (judge.id === judgeId ? updatedJudge : judge)),
      );
      setEventDetails((prev) =>
        prev
          ? {
              ...prev,
              judges: (prev.judges ?? []).map((judge) =>
                judge.id === judgeId ? updatedJudge : judge,
              ),
            }
          : prev,
      );

      toast.success("Judge updated");
      return updatedJudge;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to update judge.");
      console.error("Failed to update judge:", error);
      toast.error(message);
      throw error;
    } finally {
      setIsSavingJudge(false);
    }
  };

  const handleDeleteJudge = async (judgeId) => {
    if (!eventId) {
      toast.error("Missing event id.");
      throw new Error("MISSING_EVENT_ID");
    }

    try {
      setIsSavingJudge(true);
      await deleteEventJudge(eventId, judgeId);

      setJudges((prev) => prev.filter((judge) => judge.id !== judgeId));
      setEventDetails((prev) =>
        prev
          ? {
              ...prev,
              judges: (prev.judges ?? []).filter(
                (judge) => judge.id !== judgeId,
              ),
            }
          : prev,
      );
      setJudgeScores((prev) => {
        const next = { ...prev };
        delete next[judgeId];
        return next;
      });

      toast.success("Judge deleted");
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to delete judge.");
      console.error("Failed to delete judge:", error);
      toast.error(message);
      throw error;
    } finally {
      setIsSavingJudge(false);
    }
  };

  const handleCreateContestant = async (contestantInput) => {
    if (!eventId) {
      toast.error("Missing event id.");
      throw new Error("MISSING_EVENT_ID");
    }

    try {
      setIsSavingContestant(true);
      const createdContestant = await addEventContestant(eventId, {
        fullName: contestantInput.fullName,
        teamName:
          contestantInput.teamName ?? contestantInput.delegation ?? null,
        gender: contestantInput.gender ?? null,
        entryNo: contestantInput.entryNo ?? null,
      });

      setContestants((prev) => [
        ...prev,
        mapContestantForForm(createdContestant),
      ]);
      setEventDetails((prev) =>
        prev
          ? {
              ...prev,
              contestants: [...(prev.contestants ?? []), createdContestant],
            }
          : prev,
      );

      toast.success("Contestant added");
      return createdContestant;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to add contestant.");
      console.error("Failed to add contestant:", error);
      toast.error(message);
      throw error;
    } finally {
      setIsSavingContestant(false);
    }
  };

  const handleUpdateContestant = async (contestantId, contestantInput) => {
    if (!eventId) {
      toast.error("Missing event id.");
      throw new Error("MISSING_EVENT_ID");
    }

    try {
      setIsSavingContestant(true);
      const updatedContestant = await updateEventContestant(
        eventId,
        contestantId,
        {
          fullName: contestantInput.fullName,
          teamName:
            contestantInput.teamName ?? contestantInput.delegation ?? null,
          gender: contestantInput.gender ?? null,
          entryNo: contestantInput.entryNo ?? null,
        },
      );

      setContestants((prev) =>
        prev.map((contestant) =>
          contestant.id === contestantId
            ? mapContestantForForm(updatedContestant)
            : contestant,
        ),
      );
      setEventDetails((prev) =>
        prev
          ? {
              ...prev,
              contestants: (prev.contestants ?? []).map((contestant) =>
                contestant.id === contestantId ? updatedContestant : contestant,
              ),
            }
          : prev,
      );

      toast.success("Contestant updated");
      return updatedContestant;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to update contestant.");
      console.error("Failed to update contestant:", error);
      toast.error(message);
      throw error;
    } finally {
      setIsSavingContestant(false);
    }
  };

  const handleDeleteContestant = async (contestantId) => {
    if (!eventId) {
      toast.error("Missing event id.");
      throw new Error("MISSING_EVENT_ID");
    }

    try {
      setIsSavingContestant(true);
      await deleteEventContestant(eventId, contestantId);

      setContestants((prev) =>
        prev.filter((contestant) => contestant.id !== contestantId),
      );
      setEventDetails((prev) =>
        prev
          ? {
              ...prev,
              contestants: (prev.contestants ?? []).filter(
                (contestant) => contestant.id !== contestantId,
              ),
            }
          : prev,
      );

      toast.success("Contestant deleted");
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to delete contestant.");
      console.error("Failed to delete contestant:", error);
      toast.error(message);
      throw error;
    } finally {
      setIsSavingContestant(false);
    }
  };

  const handleImportContestants = async (contestantInputs) => {
    if (!eventId) {
      throw new Error("MISSING_EVENT_ID");
    }

    try {
      setIsSavingContestant(true);
      const createdContestants = await importEventContestants(eventId, {
        contestants: contestantInputs.map((contestantInput) => ({
          fullName: contestantInput.fullName,
          teamName:
            contestantInput.teamName ?? contestantInput.delegation ?? null,
          gender: contestantInput.gender ?? null,
          entryNo: contestantInput.entryNo ?? null,
        })),
      });

      setContestants((prev) => [
        ...prev,
        ...createdContestants.map(mapContestantForForm),
      ]);
      setEventDetails((prev) =>
        prev
          ? {
              ...prev,
              contestants: [...(prev.contestants ?? []), ...createdContestants],
            }
          : prev,
      );

      return createdContestants;
    } catch (error) {
      console.error("Failed to import contestants:", error);
      throw error;
    } finally {
      setIsSavingContestant(false);
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
      <div>
        <button
          className="btn btn-neutral btn-soft text-sm hover:bg-neutral/80"
          onClick={() => navigate("/")}
        >
          <MoveLeft /> Back to Events
        </button>
      </div>
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
              onCreateJudge: handleCreateJudge,
              onUpdateJudge: handleUpdateJudge,
              onDeleteJudge: handleDeleteJudge,
              isSavingJudge,
              judgeScores,
              setJudgeScores,
              contestants,
              setContestants,
              onCreateContestant: handleCreateContestant,
              onUpdateContestant: handleUpdateContestant,
              onDeleteContestant: handleDeleteContestant,
              onImportContestants: handleImportContestants,
              isSavingContestant,
            }}
          />
        </div>
      </section>
    </div>
  );
}
