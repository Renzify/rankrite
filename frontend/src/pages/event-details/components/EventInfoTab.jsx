import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import InfoTooltip from "../../../shared/components/InfoTooltip";

function isConditionMet(condition, fields, values) {
  const parentField = fields.find(
    (field) => field.id === condition.parentFieldId,
  );
  if (!parentField) return false;

  const selectedParentValue = values[parentField.key];
  if (!selectedParentValue) return false;

  const requiredOption = parentField.options?.find(
    (option) => option.id === condition.parentOptionId,
  );
  if (!requiredOption) return false;

  return selectedParentValue === requiredOption.value;
}

function formatDisplayLabel(label) {
  return String(label ?? "").replace(/^select\s+/i, "").trim();
}

export default function EventInfoTab() {
  const {
    isCatalogLoading,
    isTemplateLoading,
    eventDetails,
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
    isSavingEventInfo,
    onResetEventInfo,
    onSaveEventInfo,
    canManageSetup,
  } = useOutletContext();

  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const savedEventType = eventDetails?.template?.eventType ?? "";
  const savedEventTypeLabel =
    eventTypeOptions.find((option) => option.value === savedEventType)?.label ||
    savedEventType ||
    "--";

  const savedSportLabel = useMemo(() => {
    const savedTemplateFields = [
      ...(eventDetails?.template?.fields ?? []),
    ].sort((a, b) => a.sortOrder - b.sortOrder);
    const savedFormValues = eventDetails?.formValues ?? {};
    const savedSportField = savedTemplateFields.find(
      (field) => field.key === "sport",
    );

    return (
      (savedSportField?.options ?? []).find(
        (option) => option.value === savedFormValues.sport,
      )?.label ||
      savedFormValues.sport ||
      "--"
    );
  }, [eventDetails]);

  const savedDisplayFields = useMemo(() => {
    const savedTemplateFields = [
      ...(eventDetails?.template?.fields ?? []),
    ].sort((a, b) => a.sortOrder - b.sortOrder);
    const savedFormValues = eventDetails?.formValues ?? {};

    return savedTemplateFields
      .filter(
        (field) =>
          field.fieldType === "select" &&
          field.key !== "sport" &&
          field.key !== "apparatus",
      )
      .filter((field) => {
        if (!field.conditions?.length) return true;
        return field.conditions.some((condition) =>
          isConditionMet(condition, savedTemplateFields, savedFormValues),
        );
      })
      .map((field) => {
        const value = savedFormValues[field.key];
        if (value === undefined || value === null || value === "") {
          return { field, display: "--" };
        }

        const option = (field.options ?? []).find((opt) => opt.value === value);
        return { field, display: option?.label ?? String(value) };
      });
  }, [eventDetails]);

  const isEditingEventInfo = isEditing && canManageSetup;

  const canConfirmEdit =
    draftTitle.trim().length > 0 &&
    Boolean(selectedSport) &&
    !isCatalogLoading &&
    !isTemplateLoading &&
    selectableFields.every((field) => {
      if (!field.isRequired) return true;
      const value = formValues[field.key];
      return value !== undefined && value !== null && value !== "";
    });

  const handleStartEditing = () => {
    if (!canManageSetup) return;

    setDraftTitle(eventDetails?.event?.title ?? formValues.eventTitle ?? "");
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setDraftTitle(eventDetails?.event?.title ?? "");
    onResetEventInfo?.();
    setIsEditing(false);
  };

  const handleConfirmEdit = async () => {
    const didSave = await onSaveEventInfo?.(draftTitle);
    if (didSave) {
      setIsEditing(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {isEditingEventInfo ? "Edit Event Info" : "Event Info"}
          </h2>
          <InfoTooltip content="Event Info: View and manage the event's core details and configuration. It contains the basic information that defines the event." />
        </div>
        {isEditingEventInfo ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              className="btn btn-sm btn-outline w-full sm:w-auto"
              onClick={handleCancelEditing}
              disabled={isSavingEventInfo}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary w-full sm:w-auto"
              onClick={handleConfirmEdit}
              disabled={!canConfirmEdit || isSavingEventInfo}
            >
              {isSavingEventInfo ? (
                <span className="loading loading-spinner loading-xs" />
              ) : null}
              Confirm Edit
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-primary w-full sm:w-auto"
            onClick={handleStartEditing}
            disabled={!canManageSetup}
            title={
              canManageSetup
                ? "Edit event details"
                : "Setup changes are only available while the event is Draft or To Be Held."
            }
          >
            Edit
          </button>
        )}
      </div>

      {!canManageSetup ? (
        <div className="alert border border-base-300 bg-base-200/60 text-base-content">
          <span>
            Setup changes are only available while the event is Draft or To Be Held.
          </span>
        </div>
      ) : null}

      {!isEditingEventInfo ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                Event Type
              </p>
              <p className="mt-2 text-sm font-semibold">
                {savedEventTypeLabel}
              </p>
            </div>
            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                Sport
              </p>
              <p className="mt-2 text-sm font-semibold">{savedSportLabel}</p>
            </div>
          </div>

          <div className="rounded-xl border border-base-300 bg-base-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
              Event Title
            </p>
            <p className="mt-2 text-sm font-semibold">
              {eventDetails?.event?.title || "--"}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
              Selected Fields
            </h3>
            {savedDisplayFields.length === 0 ? (
              <div className="alert border border-base-300 bg-base-200/60 text-base-content">
                <span>No selectable fields yet.</span>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {savedDisplayFields.map(({ field, display }) => (
                  <div
                    key={field.id}
                    className="rounded-xl border border-base-300 bg-base-100 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                      {formatDisplayLabel(field.label)}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{display}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Event Type</span>
              </div>
              <select
                className={`select select-bordered w-full ${isCatalogLoading ? "select-disabled" : ""}`}
                value={selectedEventType}
                onChange={(event) => setSelectedEventType(event.target.value)}
                disabled={!canManageSetup || isCatalogLoading}
              >
                <option value="">-- Select Event Type --</option>
                {eventTypeOptions.map((eventType) => (
                  <option key={eventType.value} value={eventType.value}>
                    {eventType.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Sport</span>
              </div>
              <select
                className={`select select-bordered w-full ${!selectedEventType || isCatalogLoading ? "select-disabled" : ""}`}
                value={selectedSport}
                onChange={(event) => setSelectedSport(event.target.value)}
                disabled={!canManageSetup || !selectedEventType || isCatalogLoading}
              >
                <option value="">-- Select Sport --</option>
                {sportOptions.map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {sport.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="form-control w-full">
            <div className="label pb-1">
              <span className="label-text font-semibold">Event Title</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
            />
          </label>

          {selectedSport && isTemplateLoading ? (
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <span className="loading loading-spinner loading-sm" />
              Loading updated fields...
            </div>
          ) : null}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70 mt-5">
              Selected Fields
            </h3>
            {selectableFields.length === 0 ? (
              <div className="alert border border-base-300 bg-base-200/60 text-base-content">
                <span>
                  No selectable fields yet. Select event type and sport first.
                </span>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {selectableFields.map((field) => {
                  const options = getFilteredOptions(field);

                  return (
                    <label key={field.id} className="form-control w-full">
                      <div className="label pb-1">
                        <span className="label-text font-semibold">
                          {field.label}
                        </span>
                      </div>
                      <select
                        className={`select select-bordered w-full ${options.length === 0 ? "select-disabled" : ""}`}
                        value={formValues[field.key] || ""}
                        onChange={(event) =>
                          updateFieldValue(field.key, event.target.value)
                        }
                        disabled={options.length === 0}
                      >
                        <option value="">-- Select {field.label} --</option>
                        {options.map((option) => (
                          <option key={option.id} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
