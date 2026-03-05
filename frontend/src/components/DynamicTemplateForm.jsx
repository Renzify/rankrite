import {
  formatFieldLabel,
  useDynamicTemplate,
} from "../hooks/useDynamicTemplate";
import "./DynamicTemplateForm.css";

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

  return (
    <div className="dtf-page">
      <div className="dtf-backdrop dtf-backdrop-top" />
      <div className="dtf-backdrop dtf-backdrop-bottom" />

      <main className="dtf-shell">
        <header className="dtf-hero">
          <p className="dtf-kicker">Rankrite</p>
          <h1>Dynamic Event Template Builder</h1>
          <p>
            Start with event type, pick a sport, then fill only the fields that
            match your selected flow.
          </p>
        </header>

        <div className="dtf-layout">
          <section className="dtf-card dtf-card-selectors">
            <h2>Selector Panel</h2>
            <div className="dtf-controls">
              <div className="dtf-control">
                <label htmlFor="event_type">Event Type</label>
                <select
                  id="event_type"
                  className="dtf-select"
                  value={selectedEventType}
                  onChange={(event) => setSelectedEventType(event.target.value)}
                  disabled={isCatalogLoading}
                >
                  <option value="">Choose event type</option>
                  {eventTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dtf-control">
                <label htmlFor="sport">Sport</label>
                <select
                  id="sport"
                  className="dtf-select"
                  value={selectedSport}
                  onChange={(event) => setSelectedSport(event.target.value)}
                  disabled={!selectedEventType || !sportOptions.length}
                >
                  <option value="">Choose sport</option>
                  {sportOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <aside className="dtf-card dtf-card-state">
            <h3>Current Values</h3>
            <pre>
              {JSON.stringify(
                {
                  event_type: selectedEventType,
                  sport: selectedSport,
                  ...formValues,
                },
                null,
                2,
              )}
            </pre>
          </aside>
        </div>

        {catalogError && (
          <div className="dtf-card dtf-message">{catalogError}</div>
        )}

        {selectedEventType && !sportOptions.length && !isCatalogLoading && (
          <div className="dtf-card dtf-message">
            No templates available for this event type yet.
          </div>
        )}

        {templateError && (
          <div className="dtf-card dtf-message">{templateError}</div>
        )}

        {isTemplateLoading && (
          <div className="dtf-card dtf-message">
            Loading template details...
          </div>
        )}

        {template && (
          <section className="dtf-card dtf-card-form">
            <div className="dtf-template-head">
              <p className="dtf-kicker">Loaded Template</p>
              <h2>{template.name}</h2>
              {template.description && <p>{template.description}</p>}
            </div>

            <form className="dtf-form-grid">
              {visibleFields.map((field) => {
                const fieldOptions = getFilteredOptions(field);

                if (field.fieldType !== "select") return null;

                return (
                  <div key={field.id} className="dtf-field">
                    <label htmlFor={field.key}>
                      {field.label || formatFieldLabel(field.key)}
                    </label>
                    <select
                      id={field.key}
                      className="dtf-select"
                      value={formValues[field.key] || ""}
                      onChange={(event) =>
                        updateFieldValue(field.key, event.target.value)
                      }
                    >
                      <option value="">
                        Select {formatFieldLabel(field.key)}
                      </option>
                      {fieldOptions.map((option) => (
                        <option key={option.id} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default DynamicTemplateForm;
