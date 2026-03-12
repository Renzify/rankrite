import { create } from "zustand";
import {
  createEventDraft,
  deleteEvent as deleteEventRequest,
  getEvents,
} from "../api/eventApi";
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
        error?.response?.data?.message ??
        (error instanceof Error ? error.message : "Failed to load events");
      set({ error: message, isLoading: false });
    }
  },

  deleteEvent: async (eventId) => {
    try {
      await deleteEventRequest(eventId);
      set((state) => ({
        error: null,
        events: state.events.filter((event) => event.id !== eventId),
      }));
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        (error instanceof Error ? error.message : "Failed to delete event");
      set({ error: message });
      throw error;
    }
  },
}));

