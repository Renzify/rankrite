import { useMemo, useState } from "react";
import { createTemplate } from "../api/templateApi";

function createFieldId() {
  return `field_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function createEmptyField() {
  return {
    id: createFieldId(),
    key: "",
    label: "",
    fieldType: "select",
    isRequired: true,
    optionsText: "",
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
}

const defaultEventData = {
  name: "",
  eventType: "sports",
  description: "",
  sportLabel: "",
  sportValue: "",
};

export function useTemplateBuilder() {
  const [eventData, setEventData] = useState(defaultEventData);
  const [fields, setFields] = useState([createEmptyField()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validFieldCount = useMemo(
    () =>
      fields.filter(
        (field) => field.key.trim() && field.label.trim() && field.fieldType,
      ).length,
    [fields],
  );

  const updateEventData = (key, value) => {
    setEventData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateField = (id, key, value) => {
    setFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, [key]: value } : field)),
    );
  };

  const addField = () => {
    setFields((prev) => [...prev, createEmptyField()]);
  };

  const removeField = (id) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
  };

  const resetForm = () => {
    setEventData(defaultEventData);
    setFields([createEmptyField()]);
  };

  const buildPayload = () => {
    const name = eventData.name.trim();
    const eventType = eventData.eventType.trim();
    const description = eventData.description.trim();
    const sportLabel = eventData.sportLabel.trim();
    const sportValue = eventData.sportValue.trim();

    if (!name || !eventType || !sportLabel || !sportValue) {
      return {
        payload: null,
        errorMessage:
          "Please fill event name, event type, sport label, and sport value.",
      };
    }

    const cleanedFields = fields
      .map((field) => ({
        key: field.key.trim(),
        label: field.label.trim(),
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        optionsText: field.optionsText.trim(),
      }))
      .filter((field) => field.key && field.label);

    for (const field of cleanedFields) {
      if (field.fieldType === "select" && !field.optionsText) {
        return {
          payload: null,
          errorMessage: `Select field "${field.label}" needs options.`,
        };
      }
    }

    return {
      payload: {
        name,
        eventType,
        description,
        sportLabel,
        sportValue,
        fields: cleanedFields.map((field) => ({
          key: slugify(field.key),
          label: field.label,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          options:
            field.fieldType === "select"
              ? field.optionsText
                  .split(",")
                  .map((option) => option.trim())
                  .filter(Boolean)
                  .map((option) => ({
                    value: slugify(option),
                    label: option,
                  }))
              : [],
        })),
      },
      errorMessage: null,
    };
  };

  const submitTemplate = async () => {
    const { payload, errorMessage } = buildPayload();
    if (!payload) {
      return {
        ok: false,
        message: errorMessage,
      };
    }

    try {
      setIsSubmitting(true);
      await createTemplate(payload);
      resetForm();
      return {
        ok: true,
        message: "Template created successfully.",
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        message: error?.response?.data?.message || "Failed to create template.",
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    eventData,
    fields,
    isSubmitting,
    validFieldCount,
    updateEventData,
    updateField,
    addField,
    removeField,
    submitTemplate,
  };
}
