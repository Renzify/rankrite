import { create } from "zustand";
import { createEventDraft, getEvents } from "../api/eventApi";
import { buildEventPayload } from "../lib/eventPayload";

export const useEventStore = create((set) => ({
  events: [],
  isLoading: false,
  error: null,

  async saveDraft({ template, formValues, eventTitle, judges, contestants }) {
    const payload = buildEventPayload({
      template,
      formValues,
      eventTitle,
    });

    return createEventDraft({
      ...payload,
      status: "draft",
      judges: (judges ?? []).map((judge) => ({
        fullName: judge.fullName,
        judgeType: judge.judgeType,
        judgeNumber: judge.judgeNumber,
        eventPhaseId: judge.eventPhaseId ?? null,
      })),
      contestants: (contestants ?? []).map((contestant, index) => ({
        fullName: contestant.fullName,
        teamName: contestant.teamName ?? contestant.delegation ?? null,
        gender: contestant.gender ?? null,
        entryNo: contestant.entryNo ?? index + 1,
      })),
    });
  },

  loadEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const events = await getEvents();
      set({ events, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load events";
      set({ error: message, isLoading: false });
    }
  },
}));

