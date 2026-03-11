import { useMemo } from "react";
import { useNavigate } from "react-router";
import { MoveLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useDynamicTemplate } from "../hooks/useDynamicTemplate";
import { useTemplateStore } from "../stores/templateStore";
import { useEventStore } from "../stores/eventStore";
import EventTypeSportSelect from "../components/EventTypeSportSelect";
import TemplateFields from "../components/TemplateFields";
import CurrentValuesSidebar from "../components/CurrentValuesSidebar";
import TabNavigation from "../components/TabNavigation";
import JudgesTab from "../components/event-details/JudgesTab";
import ContestantsTab from "../components/event-details/ContestantsTab";

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
  const saveDraft = useEventStore((state) => state.saveDraft);

  const eventTitle = formValues.eventTitle || "";

  const handleEventTitleChange = (event) => {
    updateFieldValue("eventTitle", event.target.value);
  };

  const isFormComplete = useMemo(() => {
    if (!selectedSport || !template) return false;

    const isEventTitleFilled = eventTitle.trim().length > 0;
    if (!isEventTitleFilled) return false;

    return visibleFields.every((field) => {
      if (!field.isRequired) return true;
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

  const handleSaveDraft = async () => {
    try {
      await saveDraft({
        template,
        formValues,
        eventTitle,
        judges,
        contestants,
      });
      toast.success("Saved as draft");
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
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft. Please try again.");
    }
  };

  const handleCreateEvent = () => {
    if (!canCreateEvent) return;
    toast.success("Event created");
  };
  return (
    <div className="app-page app-page-wide space-y-5">
      <div>
        <button
          className="btn btn-neutral btn-soft text-sm hover:bg-neutral/80"
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
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-black md:text-4xl">
            Dynamic Template Form
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-black opacity-95 md:text-base">
            Create your event by selecting an event type and field.
          </p>
        </div>
      </section>

      <TabNavigation isFormComplete={isFormComplete} />

      <div
        className={`grid gap-5 ${currentTab === "details" ? "" : "lg:grid-cols-[1.7fr_1fr]"}`}
      >
        <section className="app-surface-soft">
          <div className="app-section space-y-5">
            {currentTab === "details" && (
              <h2 className="text-xl font-semibold tracking-tight">
                Template Selection
              </h2>
            )}

            {catalogError ? (
              <div className="alert alert-error">
                <span>{catalogError}</span>
              </div>
            ) : null}

            {currentTab === "details" && (
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

            {currentTab === "judges" && <JudgesTab />}
            {currentTab === "contestants" && <ContestantsTab />}
          </div>
        </section>

        {currentTab !== "details" && (
          <CurrentValuesSidebar
            selectedEventType={selectedEventType}
            selectedSport={selectedSport}
            eventTitle={eventTitle}
            template={template}
            visibleFields={visibleFields}
            formValues={formValues}
            currentTab={currentTab}
            judges={judges}
            contestants={contestants}
          />
        )}
      </div>

      {(currentTab === "judges" || currentTab === "contestants") && (
        <div className="flex w-full flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            onClick={handleSaveDraft}
            className="btn btn-outline w-full sm:w-auto"
          >
            Save as Draft
          </button>
          {canCreateEvent && (
            <button
              onClick={handleCreateEvent}
              className="btn btn-success w-full sm:w-auto"
            >
              Create Event
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default DynamicTemplateForm;
