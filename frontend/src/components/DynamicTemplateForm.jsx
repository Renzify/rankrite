import { useMemo } from "react";
import toast from "react-hot-toast";
import { useDynamicTemplate } from "../hooks/useDynamicTemplate";
import { useTemplateStore } from "../stores/templateStore";
import EventTypeSportSelect from "./EventTypeSportSelect";
import TemplateFields from "./TemplateFields";
import CurrentValuesSidebar from "./CurrentValuesSidebar";
import TabNavigation from "./TabNavigation";
import JudgesTab from "./JudgesTab";
import ContestantsTab from "./ContestantsTab";

const STAGES = [
  { key: "eventType", label: "Event Type" },
  { key: "sport", label: "Sport" },
  { key: "details", label: "Template Details" },
];

// function getActiveStageIndex(selectedEventType, selectedSport) {
//   if (!selectedEventType) return 0;
//   if (!selectedSport) return 1;
//   return 2;
// }

function DynamicTemplateForm() {
  const {
    catalog,
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

  // Handle event title separately from template fields
  const eventTitle = formValues.eventTitle || "";

  const handleEventTitleChange = (e) => {
    updateFieldValue("eventTitle", e.target.value);
  };

  // Check if all required fields are filled
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

  const handleSaveDraft = () => {
    toast.success("Saved as draft");
  };

  const handleCreateEvent = () => {
    if (!canCreateEvent) return;
    toast.success("Event created");
  };

  const totalSports = useMemo(
    () =>
      selectedEventType
        ? catalog
            .filter((item) => item.eventType === selectedEventType)
            .reduce((count, item) => count + (item.sports?.length ?? 0), 0)
        : 0,
    [catalog, selectedEventType],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-emerald-300/40 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        {/* Header Section */}
        <section className="card border border-base-300 bg-gradient-to-br from-slate-900 via-blue-800 to-cyan-600 text-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">
              Event Setup
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Dynamic Template Form
            </h1>
            <p className="mt-2 max-w-3xl text-sm opacity-95 md:text-base">
              Select an event type, choose a sport, then fill in only the fields
              required by that template.
            </p>

            <div className="stats stats-vertical mt-4 border border-white/30 bg-white/10 shadow-none sm:stats-horizontal">
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Event Types</div>
                <div className="stat-value text-2xl text-base-100">
                  {eventTypeOptions.length}
                </div>
              </div>
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Sports</div>
                <div className="stat-value text-2xl text-base-100">
                  {selectedEventType ? totalSports : "-"}
                </div>
              </div>
              <div className="stat py-3">
                <div className="stat-title text-base-100/80">Fields</div>
                <div className="stat-value text-2xl text-base-100">
                  {template ? visibleFields.length : "-"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation - Always visible */}
        <TabNavigation isFormComplete={isFormComplete} />

        <div
          className={`grid gap-4 ${currentTab === "details" ? "" : "lg:grid-cols-[1.7fr_1fr]"}`}
        >
          {/* Main Form Section */}
          <section className="card border border-base-300 bg-base-100/90 shadow-xl">
            <div className="card-body gap-5">
              {currentTab === "details" && (
                <h2 className="card-title">Template Selection</h2>
              )}

              {catalogError ? (
                <div className="alert alert-error">
                  <span>{catalogError}</span>
                </div>
              ) : null}

              {/* Event Type and Sport Selection - Only show on details tab */}
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

                  {/* Loading/Error/Info Messages */}
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

                  {/* Dynamic Template Fields */}
                  <TemplateFields
                    template={template}
                    formValues={formValues}
                    visibleFields={visibleFields}
                    isTemplateLoading={isTemplateLoading}
                    templateError={templateError}
                    updateFieldValue={updateFieldValue}
                    getFilteredOptions={getFilteredOptions}
                  />

                  {/* Continue Button */}
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
                        Continue to Add Judges →
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Judges Tab */}
              {currentTab === "judges" && <JudgesTab />}

              {/* Contestants Tab */}
              {currentTab === "contestants" && <ContestantsTab />}
            </div>
          </section>

          {/* Sidebar with Current Values - Only show when not on details tab */}
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
          <div className="flex w-full flex-col gap-2 pt-3 sm:flex-row sm:justify-end">
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
      </main>
    </div>
  );
}

export default DynamicTemplateForm;
