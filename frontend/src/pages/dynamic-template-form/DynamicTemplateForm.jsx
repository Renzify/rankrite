import { useLayoutEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { MoveLeft, MoveRight } from "lucide-react";
import toast from "react-hot-toast";
import { useDynamicTemplate } from "./hooks/useDynamicTemplate";
import { useTemplateStore } from "../../stores/templateStore";
import { useEventStore } from "../../stores/eventStore";
import EventTypeSportSelect from "./components/EventTypeSportSelect";
import TemplateFields from "./components/TemplateFields";
import TabNavigation from "./components/TabNavigation";
import JudgesTab from "../event-details/components/judge-tab/JudgesTab";
import ContestantsTab from "../event-details/components/contestant-tab/ContestantsTab";

function DynamicTemplateForm() {
  const navigate = useNavigate();
  const {
    isCatalogLoading,
    catalogError,
    selectedEventType,
    selectedSport,
    template,
    formValues,
    isTemplateLoading,
    templateError,
    eventTypeOptions,
    sportOptions,
    visibleFields,
    setSelectedEventType,
    setSelectedSport,
    updateFieldValue,
    getFilteredOptions,
  } = useDynamicTemplate();

  const currentTab = useTemplateStore((state) => state.currentTab);
  const setCurrentTab = useTemplateStore((state) => state.setCurrentTab);
  const judges = useTemplateStore((state) => state.judges);
  const contestants = useTemplateStore((state) => state.contestants);
  const resetEventDraftState = useTemplateStore(
    (state) => state.resetEventDraftState,
  );
  const saveDraft = useEventStore((state) => state.saveDraft);
  const createEvent = useEventStore((state) => state.createEvent);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const eventTitle = formValues.eventTitle || "";

  useLayoutEffect(() => {
    resetEventDraftState();
  }, [resetEventDraftState]);

  const handleEventTitleChange = (event) => {
    updateFieldValue("eventTitle", event.target.value);
  };

  const isFormComplete = useMemo(() => {
    if (!selectedSport || !template) return false;

    const isEventTitleFilled = eventTitle.trim().length > 0;
    if (!isEventTitleFilled) return false;

    return visibleFields.every((field) => {
      if (!field.isRequired || field.key === "apparatus") return true;
      const value = formValues[field.key];
      return value !== undefined && value !== null && value !== "";
    });
  }, [selectedSport, template, visibleFields, formValues, eventTitle]);

  const handleContinueToJudges = () => {
    if (isFormComplete) {
      setCurrentTab("judges");
    }
  };

  const canCreateEvent = judges.length > 0 && contestants.length > 0;
  const isSetupDetailsTab = currentTab === "details";

  const handleSaveDraft = async () => {
    try {
      const savedDraft = await saveDraft({
        template,
        formValues,
        eventTitle,
        judges,
        contestants,
      });

      if (!savedDraft?.id) {
        throw new Error("MISSING_EVENT_ID");
      }

      toast.success("Saved as draft");
      navigate(`/events/${savedDraft.id}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "NO_TEMPLATE_SELECTED") {
          toast.error("No template selected.");
          return;
        }
        if (error.message === "NO_EVENT_TITLE") {
          toast.error("Please enter an event title before saving.");
          return;
        }
      }

      const message =
        error?.response?.data?.message ??
        (error instanceof Error ? error.message : "Failed to save draft.");
      console.error("Failed to save draft:", error);
      toast.error(message);
    }
  };

  const handleCreateEvent = async () => {
    if (!canCreateEvent) return;

    try {
      setIsCreatingEvent(true);
      const createdEvent = await createEvent({
        template,
        formValues,
        eventTitle,
        judges,
        contestants,
      });

      if (!createdEvent?.id) {
        throw new Error("MISSING_EVENT_ID");
      }

      toast.success("Event created");
      navigate(`/events/${createdEvent.id}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "NO_TEMPLATE_SELECTED") {
          toast.error("No template selected.");
          return;
        }
        if (error.message === "NO_EVENT_TITLE") {
          toast.error("Please enter an event title before creating.");
          return;
        }
      }

      const message =
        error?.response?.data?.message ??
        (error instanceof Error ? error.message : "Failed to create event.");
      console.error("Failed to create event:", error);
      toast.error(message);
    } finally {
      setIsCreatingEvent(false);
    }
  };
  return (
    <div className="app-page app-page-wide space-y-5">
      <div>
        <button
          className="btn btn-neutral btn-soft w-full text-sm hover:bg-neutral/80 sm:w-auto"
          onClick={() => navigate("/dashboard")}
        >
          <MoveLeft /> Back to Events
        </button>
      </div>

      <section className="app-surface text-base-100">
        <div className="app-section">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black opacity-80">
            Event Setup
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
            Dynamic Template Form
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-black opacity-95 md:text-base">
            Create your event by selecting an event type and field.
          </p>
        </div>
      </section>

      <TabNavigation isFormComplete={isFormComplete} />

      <div>
        <section
          className={isSetupDetailsTab ? "app-surface-soft" : "app-surface"}
        >
          <div className="app-section space-y-5">
            {isSetupDetailsTab && (
              <h2 className="text-xl font-semibold tracking-tight">
                Template Selection
              </h2>
            )}

            {catalogError ? (
              <div className="alert alert-error">
                <span>{catalogError}</span>
              </div>
            ) : null}

            {isSetupDetailsTab && (
              <>
                <EventTypeSportSelect
                  selectedEventType={selectedEventType}
                  selectedSport={selectedSport}
                  isCatalogLoading={isCatalogLoading}
                  eventTypeOptions={eventTypeOptions}
                  sportOptions={sportOptions}
                  eventTitle={eventTitle}
                  setSelectedEventType={setSelectedEventType}
                  setSelectedSport={setSelectedSport}
                  handleEventTitleChange={handleEventTitleChange}
                />

                {!selectedSport ? (
                  <div className="alert border border-base-300 bg-base-200/60 text-base-content">
                    <span>
                      Choose an event to load its template-specific fields.
                    </span>
                  </div>
                ) : null}

                {selectedSport && isTemplateLoading ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="loading loading-spinner loading-sm" />
                    Loading template...
                  </div>
                ) : null}

                {selectedSport && templateError ? (
                  <div className="alert alert-error">
                    <span>{templateError}</span>
                  </div>
                ) : null}

                <TemplateFields
                  template={template}
                  formValues={formValues}
                  visibleFields={visibleFields}
                  isTemplateLoading={isTemplateLoading}
                  templateError={templateError}
                  updateFieldValue={updateFieldValue}
                  getFilteredOptions={getFilteredOptions}
                />

                {selectedSport && !isTemplateLoading && (
                  <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                    {isFormComplete && (
                      <button
                        onClick={handleSaveDraft}
                        className="btn btn-outline w-full sm:w-auto"
                      >
                        Save as Draft
                      </button>
                    )}
                    <button
                      onClick={handleContinueToJudges}
                      disabled={!isFormComplete}
                      className={`btn w-full sm:w-auto ${
                        isFormComplete
                          ? "btn-primary"
                          : "btn-disabled !opacity-100 !text-white/80 !bg-slate-500/30 !border-slate-500/40 !shadow-none grayscale cursor-not-allowed"
                      }`}
                    >
                      Continue to Add Judges
                    </button>
                  </div>
                )}
              </>
            )}

            {currentTab === "judges" && (
              <JudgesTab
                showLinkGeneration={false}
                showActiveContestantControl={false}
              />
            )}
            {currentTab === "contestants" && <ContestantsTab />}
          </div>
        </section>
      </div>

      {(currentTab === "judges" || currentTab === "contestants") && (
        <div className="flex w-full flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {currentTab === "judges" && (
              <button
                type="button"
                onClick={() => setCurrentTab("details")}
                className="btn btn-ghost w-full sm:w-auto"
              >
                <MoveLeft className="size-4" /> Add Details
              </button>
            )}
            {currentTab === "contestants" && (
              <button
                type="button"
                onClick={() => setCurrentTab("judges")}
                className="btn btn-ghost w-full sm:w-auto"
              >
                <MoveLeft className="size-4" /> Add Judges
              </button>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn btn-outline w-full sm:w-auto"
            >
              Save as Draft
            </button>
            {currentTab === "judges" && (
              <button
                type="button"
                onClick={() => setCurrentTab("contestants")}
                className="btn btn-primary w-full sm:w-auto"
              >
                Add Contestants <MoveRight className="size-4" />
              </button>
            )}
            {canCreateEvent && (
              <button
                type="button"
                onClick={handleCreateEvent}
                disabled={isCreatingEvent}
                className="btn btn-success w-full sm:w-auto"
              >
                {isCreatingEvent ? "Creating..." : "Create Event"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DynamicTemplateForm;
