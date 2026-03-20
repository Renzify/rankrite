const EVENT_STATUS_LABEL_BY_VALUE = {
  draft: "Draft",
  to_be_held: "To Be Held",
  live: "Live",
  finished: "Finished",
};

export function mapContestantForForm(contestant) {
  return {
    ...contestant,
    teamName: contestant.teamName ?? contestant.delegation ?? "",
    delegation: contestant.teamName ?? contestant.delegation ?? "",
  };
}

export function applyLoadedEventDetails(data, actions) {
  const nextContestants = (data.contestants ?? []).map(mapContestantForForm);
  const activeContestantId = data.event?.activeContestantId ?? "";

  actions.setEventDetails(data);
  actions.setSelectedEventType(data.template?.eventType ?? "");
  actions.setSelectedSport(data.formValues?.sport ?? "");
  actions.setJudges(data.judges ?? []);
  actions.setContestants(nextContestants);
  actions.setActiveContestantId?.(() => {
    if (
      activeContestantId &&
      nextContestants.some((contestant) => contestant.id === activeContestantId)
    ) {
      return activeContestantId;
    }

    return "";
  });
  actions.setPendingFormValues({
    ...data.formValues,
    eventTitle: data.event.title,
  });
  actions.setDidHydrate(false);
}

export function getApiErrorMessage(error, fallbackMessage) {
  const responseMessage = error?.response?.data?.message;

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export function formatEventStatusLabel(status) {
  if (!status) return "Unknown";

  return (
    EVENT_STATUS_LABEL_BY_VALUE[status] ??
    status
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

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

export function isEventInfoComplete(eventDetails) {
  if (!eventDetails) return false;

  const eventTitle = eventDetails.event?.title ?? "";
  if (!eventTitle.trim()) return false;

  const templateFields = eventDetails.template?.fields ?? [];
  const formValues = eventDetails.formValues ?? {};

  if (!formValues.sport) return false;

  return templateFields.every((field) => {
    if (
      field.isActive === false ||
      !field.isRequired ||
      field.key === "apparatus"
    ) {
      return true;
    }

    if (field.key === "sport") {
      return Boolean(formValues.sport);
    }

    if (field.conditions?.length) {
      const isVisible = field.conditions.some((condition) =>
        isConditionMet(condition, templateFields, formValues),
      );
      if (!isVisible) return true;
    }

    const value = formValues[field.key];
    return value !== undefined && value !== null && value !== "";
  });
}