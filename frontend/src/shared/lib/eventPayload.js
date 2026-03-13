export function buildEventPayload({ template, formValues, eventTitle }) {
  if (!template) {
    throw new Error("NO_TEMPLATE_SELECTED");
  }

  const title = (eventTitle ?? "").trim();
  if (!title) {
    throw new Error("NO_EVENT_TITLE");
  }

  const fieldValues = template.fields
    .map((field) => {
      const value = formValues[field.key];
      if (value === undefined || value === null || value === "") {
        return null;
      }

      if (field.fieldType === "select") {
        const option = (field.options ?? []).find((opt) => opt.value === value);

        if (option) {
          return {
            fieldId: field.id,
            optionId: option.id,
            valueText: null,
          };
        }
      }

      return {
        fieldId: field.id,
        optionId: null,
        valueText: String(value),
      };
    })
    .filter(Boolean);

  return {
    templateId: template.id,
    title,
    fieldValues,
  };
}
