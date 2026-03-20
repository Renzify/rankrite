import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import toast from "react-hot-toast";
import { useDynamicTemplate } from "../../dynamic-template-form/hooks/useDynamicTemplate";
import {
  addEventContestant,
  addEventJudge,
  deleteEventContestant,
  deleteEventJudge,
  getEventDetails,
  importEventContestants,
  setEventActiveContestant,
  updateCurrentEventPhase,
  updateEvent,
  updateEventContestant,
  updateEventJudge,
} from "../../../api/eventApi";
import { buildEventPayload } from "../../../shared/lib/eventPayload";
import {
  applyLoadedEventDetails,
  getApiErrorMessage,
  mapContestantForForm,
} from "./eventDetailsHelpers";
import { useEventStatusActions } from "./useEventStatusActions";

export function useEventDetailsPage() {
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
  const [activeContestantId, setActiveContestantId] = useState("");
  const [judgeScores, setJudgeScores] = useState({});
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [pendingFormValues, setPendingFormValues] = useState(null);
  const [didHydrate, setDidHydrate] = useState(false);
  const [isSavingEventInfo, setIsSavingEventInfo] = useState(false);
  const [isSavingJudge, setIsSavingJudge] = useState(false);
  const [isSavingContestant, setIsSavingContestant] = useState(false);
  const [isUpdatingCurrentPhase, setIsUpdatingCurrentPhase] = useState(false);
  const [isSwitchingActiveContestant, setIsSwitchingActiveContestant] =
    useState(false);

  const syncLoadedEventDetails = useCallback(
    (data) => {
      applyLoadedEventDetails(data, {
        setEventDetails,
        setSelectedEventType,
        setSelectedSport,
        setJudges,
        setContestants,
        setActiveContestantId,
        setPendingFormValues,
        setDidHydrate,
      });
    },
    [setSelectedEventType, setSelectedSport],
  );

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

        syncLoadedEventDetails(data);
      } catch (error) {
        if (!isMounted) return;
        console.error(error);
        setLoadError("Failed to load event details.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadEvent();

    return () => {
      isMounted = false;
    };
  }, [eventId, syncLoadedEventDetails]);

  useEffect(() => {
    if (!pendingFormValues || !template || didHydrate) return;
    setFormValues(pendingFormValues);
    setDidHydrate(true);
  }, [pendingFormValues, template, didHydrate, setFormValues]);

  useEffect(() => {
    setActiveContestantId((currentId) => {
      if (contestants.some((contestant) => contestant.id === currentId)) {
        return currentId;
      }

      return "";
    });
  }, [contestants]);

  const eventTitle =
    eventDetails?.event?.title || formValues.eventTitle || "Event Details";
  const eventPhases = eventDetails?.eventPhases ?? [];
  const currentEventPhaseId =
    eventDetails?.currentEventPhaseId ?? eventPhases[0]?.id ?? "";
  const selectableFields = useMemo(
    () =>
      visibleFields.filter(
        (field) => field.fieldType === "select" && field.key !== "apparatus",
      ),
    [visibleFields],
  );

  const {
    canGenerateJudgeLinks,
    canManageSetup,
    currentEventStatus,
    eventStatusBadgeClass,
    handleEventStatusChange,
    isDraftToBeHeldRestricted,
    isUpdatingEventStatus,
    manualEventStatusActions,
    pendingEventStatusAction,
  } = useEventStatusActions({
    eventId,
    eventDetails,
    judges,
    contestants,
    syncLoadedEventDetails,
  });

  const handleResetEventInfo = () => {
    if (!eventDetails) return;
    syncLoadedEventDetails(eventDetails);
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

      syncLoadedEventDetails(updatedDetails);
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

  const handleSetActiveContestant = async (nextContestantId) => {
    if (!eventId || !nextContestantId) {
      return;
    }

    try {
      setIsSwitchingActiveContestant(true);
      const updatedDetails = await setEventActiveContestant(eventId, {
        contestantId: nextContestantId,
      });

      syncLoadedEventDetails(updatedDetails);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Failed to switch active contestant.",
      );
      console.error("Failed to switch active contestant:", error);
      toast.error(message);
      throw error;
    } finally {
      setIsSwitchingActiveContestant(false);
    }
  };

  const handleCurrentPhaseChange = async (nextPhaseId) => {
    if (!eventId || !nextPhaseId) {
      return;
    }

    try {
      setIsUpdatingCurrentPhase(true);
      const updatedDetails = await updateCurrentEventPhase(eventId, {
        eventPhaseId: nextPhaseId,
      });

      syncLoadedEventDetails(updatedDetails);
      setJudgeScores({});
      toast.success("Current apparatus updated");
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Failed to update current apparatus.",
      );
      console.error("Failed to update current apparatus:", error);
      toast.error(message);
    } finally {
      setIsUpdatingCurrentPhase(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return {
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
    outletContext: {
      activeContestantId,
      canGenerateJudgeLinks,
      canManageSetup,
      contestants,
      currentEventPhaseId,
      currentEventStatus,
      eventDetails,
      eventPhases,
      eventTitle,
      eventTypeOptions,
      formValues,
      getFilteredOptions,
      isCatalogLoading,
      isSavingContestant,
      isSavingEventInfo,
      isSavingJudge,
      isSwitchingActiveContestant,
      isTemplateLoading,
      judgeScores,
      judges,
      onCreateContestant: handleCreateContestant,
      onCreateJudge: handleCreateJudge,
      onDeleteContestant: handleDeleteContestant,
      onDeleteJudge: handleDeleteJudge,
      onImportContestants: handleImportContestants,
      onResetEventInfo: handleResetEventInfo,
      onSaveEventInfo: handleSaveEventInfo,
      onSetActiveContestant: handleSetActiveContestant,
      onUpdateContestant: handleUpdateContestant,
      onUpdateJudge: handleUpdateJudge,
      selectableFields,
      selectedEventType,
      selectedSport,
      setActiveContestantId,
      setContestants,
      setJudgeScores,
      setJudges,
      setSelectedEventType,
      setSelectedSport,
      sportOptions,
      updateFieldValue,
    },
    pendingEventStatusAction,
  };
}