import { create } from "zustand";

const EVENT_STATUSES = [
  { value: "to_be_held", label: "To Be Held", color: "badge-warning" },
  { value: "ongoing", label: "On Going", color: "badge-success" },
  { value: "finished", label: "Finished", color: "badge-neutral" },
];

const JUDGE_TYPES = [
  { value: "difficulty_body", label: "Difficulty Body" },
  { value: "difficulty_apparatus", label: "Difficulty Apparatus" },
  { value: "artistry", label: "Artistry" },
  { value: "execution", label: "Execution" },
  { value: "time_judge", label: "Time Judge" },
  { value: "line_judge", label: "Line Judge" },
];

export const useEventStore = create((set, get) => ({
  // Events list
  events: [
    {
      id: "1",
      title: "Gymnastics Regionals 2024",
      templateName: "Gymnastics Template",
      sport: "artistic_gymnastics",
      status: "ongoing",
      createdAt: new Date().toISOString(),
      formValues: { competitionLevel: "regional" },
      judges: [
        {
          id: "j1",
          fullName: "John Smith",
          judgeType: "execution",
          judgeNumber: 1,
        },
        {
          id: "j2",
          fullName: "Jane Doe",
          judgeType: "difficulty_apparatus",
          judgeNumber: 2,
        },
      ],
      contestants: [
        { id: "c1", fullName: "Alice Johnson", teamName: "Manila", entryNo: 1 },
        { id: "c2", fullName: "Bob Williams", teamName: "Cebu", entryNo: 2 },
        { id: "c3", fullName: "Charlie Brown", teamName: "Davao", entryNo: 3 },
      ],
      phases: [
        {
          id: "p1",
          label: "Vault",
          type: "apparatus_round",
          sequenceNo: 1,
          isActive: true,
        },
        {
          id: "p2",
          label: "Floor",
          type: "apparatus_round",
          sequenceNo: 2,
          isActive: false,
        },
        {
          id: "p3",
          label: "Beam",
          type: "apparatus_round",
          sequenceNo: 3,
          isActive: false,
        },
      ],
      currentPhaseId: "p1",
      currentContestantId: "c1",
      scores: {},
      rankings: [],
    },
    {
      id: "2",
      title: "Pageant Finals 2024",
      templateName: "Pageant Template",
      sport: "beauty_pageant",
      status: "to_be_held",
      createdAt: new Date().toISOString(),
      formValues: { category: "miss" },
      judges: [],
      contestants: [],
      phases: [],
      currentPhaseId: null,
      currentContestantId: null,
      scores: {},
      rankings: [],
    },
    {
      id: "3",
      title: "Dance Sports Championship",
      templateName: "Dance Sports Template",
      sport: "standard_latin",
      status: "finished",
      createdAt: new Date().toISOString(),
      formValues: { division: "amateur" },
      judges: [],
      contestants: [],
      phases: [],
      currentPhaseId: null,
      currentContestantId: null,
      scores: {},
      rankings: [],
    },
  ],

  // Selected event for viewing/editing
  selectedEvent: null,
  selectedView: "scoring", // scoring | judges | contestants | rankings | display

  // Get status options
  getStatusOptions: () => EVENT_STATUSES,
  getJudgeTypes: () => JUDGE_TYPES,

  // Get status label and color
  getStatusInfo: (status) => {
    const statusInfo = EVENT_STATUSES.find((s) => s.value === status);
    return statusInfo || { value: status, label: status, color: "badge-ghost" };
  },

  // Actions
  addEvent: (event) =>
    set((state) => ({
      events: [
        ...state.events,
        {
          ...event,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          judges: [],
          contestants: [],
          phases: [],
          currentPhaseId: null,
          currentContestantId: null,
          scores: {},
          rankings: [],
        },
      ],
    })),

  updateEvent: (eventId, updates) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId ? { ...event, ...updates } : event,
      ),
    })),

  deleteEvent: (eventId) =>
    set((state) => ({
      events: state.events.filter((event) => event.id !== eventId),
    })),

  setSelectedEvent: (eventId) => {
    const event = get().events.find((e) => e.id === eventId);
    set({ selectedEvent: event || null });
  },

  clearSelectedEvent: () => set({ selectedEvent: null }),

  setSelectedView: (view) => set({ selectedView: view }),

  // Phase/Aparatus actions
  setCurrentPhase: (eventId, phaseId) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId ? { ...event, currentPhaseId: phaseId } : event,
      ),
    })),

  setCurrentContestant: (eventId, contestantId) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId
          ? { ...event, currentContestantId: contestantId }
          : event,
      ),
    })),

  // Judge actions for event
  addJudgeToEvent: (eventId, judge) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              judges: [...event.judges, { ...judge, id: crypto.randomUUID() }],
            }
          : event,
      ),
    })),

  removeJudgeFromEvent: (eventId, judgeId) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId
          ? { ...event, judges: event.judges.filter((j) => j.id !== judgeId) }
          : event,
      ),
    })),

  // Contestant actions for event
  addContestantToEvent: (eventId, contestant) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              contestants: [
                ...event.contestants,
                { ...contestant, id: crypto.randomUUID() },
              ],
            }
          : event,
      ),
    })),

  removeContestantFromEvent: (eventId, contestantId) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              contestants: event.contestants.filter(
                (c) => c.id !== contestantId,
              ),
            }
          : event,
      ),
    })),

  // Score actions
  submitScore: (eventId, contestantId, judgeId, score) =>
    set((state) => {
      const events = state.events.map((event) => {
        if (event.id !== eventId) return event;

        const scoreKey = `${contestantId}-${event.currentPhaseId}`;
        const currentScores = event.scores[scoreKey] || {};

        return {
          ...event,
          scores: {
            ...event.scores,
            [scoreKey]: {
              ...currentScores,
              [judgeId]: score,
            },
          },
        };
      });

      return { events };
    }),

  // Calculate rankings
  computeRankings: (eventId) =>
    set((state) => {
      const event = state.events.find((e) => e.id === eventId);
      if (!event) return state;

      const phase = event.phases.find((p) => p.id === event.currentPhaseId);
      if (!phase) return state;

      const rankings = event.contestants
        .map((contestant) => {
          const scoreKey = `${contestant.id}-${phase.id}`;
          const contestantScores = event.scores[scoreKey] || {};
          const scoreValues = Object.values(contestantScores);
          const avgScore =
            scoreValues.length > 0
              ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
              : 0;

          return {
            contestantId: contestant.id,
            contestantName: contestant.fullName,
            teamName: contestant.teamName,
            entryNo: contestant.entryNo,
            totalScore: avgScore,
            submittedScores: scoreValues.length,
            isComplete: scoreValues.length === event.judges.length,
          };
        })
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((r, index) => ({ ...r, rank: index + 1 }));

      const events = state.events.map((e) =>
        e.id === eventId ? { ...e, rankings } : e,
      );

      return { events };
    }),

  // Update event status
  updateEventStatus: (eventId, status) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId ? { ...event, status } : event,
      ),
    })),
}));
