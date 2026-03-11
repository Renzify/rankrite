import { create } from "zustand";
import { createEventDraft } from "../api/eventApi";

export const useEventStore = create(() => ({
  async saveDraft({ template, formValues, eventTitle, judges, contestants }) {
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
          const option = (field.options ?? []).find(
            (opt) => opt.value === value,
          );

          if (option) {
            return {
              fieldId: field.id,
              optionId: option.id,
              valueText: null,
            };
          }

          return {
            fieldId: field.id,
            optionId: null,
            valueText: String(value),
          };
        }

        return {
          fieldId: field.id,
          optionId: null,
          valueText: String(value),
        };
      })
      .filter(Boolean);

    return createEventDraft({
      templateId: template.id,
      title,
      status: "draft",
      fieldValues,
      judges: (judges ?? []).map((judge) => ({
        fullName: judge.fullName,
        judgeType: judge.judgeType,
        judgeNumber: judge.judgeNumber,
        eventPhaseId: judge.eventPhaseId ?? null,
      })),
      contestants: (contestants ?? []).map((contestant, index) => ({
        fullName: contestant.fullName,
        teamName: contestant.teamName ?? null,
        gender: contestant.gender ?? null,
        entryNo: contestant.entryNo ?? index + 1,
      })),
    });
  },
}));

