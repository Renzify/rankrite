import { useMemo } from "react";
import { useDynamicTemplate } from "../hooks/useDynamicTemplate";
import FormStages from "./FormStages";
import EventTypeSportSelect from "./EventTypeSportSelect";
import TemplateFields from "./TemplateFields";
import CurrentValuesSidebar from "./CurrentValuesSidebar";

const STAGES = [
  { key: "eventType", label: "Event Type" },
  { key: "sport", label: "Sport" },
  { key: "details", label: "Template Details" },
];

function getActiveStageIndex(selectedEventType, selectedSport) {
  if (!selectedEventType) return 0;
  if (!selectedSport) return 1;
  return 2;
}

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

  // Handle event title separately from template fields
  const eventTitle = formValues.eventTitle || "";

  const handleEventTitleChange = (e) => {
    updateFieldValue("eventTitle", e.target.value);
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

        {/* Form Stages Indicator */}
        <FormStages
          selectedEventType={selectedEventType}
          selectedSport={selectedSport}
        />

        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          {/* Main Form Section */}
          <section className="card border border-base-300 bg-base-100/90 shadow-xl">
            <div className="card-body gap-5">
              <h2 className="card-title">Template Selection</h2>

              {catalogError ? (
                <div className="alert alert-error">
                  <span>{catalogError}</span>
                </div>
              ) : null}

              {/* Event Type and Sport Selection */}
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
                    Choose a sport to load its template-specific fields.
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
            </div>
          </section>

          {/* Sidebar with Current Values */}
          <CurrentValuesSidebar
            selectedEventType={selectedEventType}
            selectedSport={selectedSport}
            eventTitle={eventTitle}
            template={template}
            visibleFields={visibleFields}
            formValues={formValues}
          />
        </div>
      </main>
    </div>
  );
}

export default DynamicTemplateForm;
