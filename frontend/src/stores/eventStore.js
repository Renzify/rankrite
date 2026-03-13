import { create } from "zustand";
import {
  createEventDraft,
  deleteEvent as deleteEventRequest,
  getEvents,
} from "../api/eventApi";
import { buildEventPayload } from "../lib/eventPayload";

function buildPersistedEventPayload({
  template,
  formValues,
  eventTitle,
  judges,
  contestants,
  status,
}) {
  const payload = buildEventPayload({
    template,
    formValues,
    eventTitle,
  });

  return {
    ...payload,
    status,
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
  };
}

export const useEventStore = create((set) => ({
  events: [],
  isLoading: false,
  error: null,

  async saveDraft({ template, formValues, eventTitle, judges, contestants }) {
    return createEventDraft(
      buildPersistedEventPayload({
        template,
        formValues,
        eventTitle,
        judges,
        contestants,
        status: "draft",
      }),
    );
  },

  async createEvent({ template, formValues, eventTitle, judges, contestants }) {
    const createdEvent = await createEventDraft(
      buildPersistedEventPayload({
        template,
        formValues,
        eventTitle,
        judges,
        contestants,
        status: "to_be_held",
      }),
    );

    set((state) => ({
      error: null,
      events: [createdEvent, ...state.events.filter((event) => event.id !== createdEvent.id)],
    }));

    return createdEvent;
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

