import { create } from "zustand";

export const useTemplateStore = create((set) => ({
  catalog: [],
  isCatalogLoading: false,
  catalogError: null,

  selectedEventType: "",
  selectedSport: "",

  template: null,
  formValues: {},
  isTemplateLoading: false,
  templateError: null,

  // Tab and participant management
  currentTab: "details", // details | judges | contestants
  judges: [],
  contestants: [],

  setCatalog: (catalog) => set({ catalog }),
  setCatalogLoading: (isCatalogLoading) => set({ isCatalogLoading }),
  setCatalogError: (catalogError) => set({ catalogError }),

  setSelectedEventType: (selectedEventType) =>
    set({
      selectedEventType,
      selectedSport: "",
      template: null,
      formValues: {},
      templateError: null,
      currentTab: "details",
      judges: [],
      contestants: [],
    }),

  setSelectedSport: (selectedSport) =>
    set({
      selectedSport,
      template: null,
      formValues: {},
      templateError: null,
      currentTab: "details",
      judges: [],
      contestants: [],
    }),

  setTemplate: (template) =>
    set((state) => ({
      template,
      formValues: state.selectedSport ? { sport: state.selectedSport } : {},
    })),
  clearTemplate: () =>
    set({
      template: null,
      formValues: {},
      currentTab: "details",
      judges: [],
      contestants: [],
    }),
  setTemplateLoading: (isTemplateLoading) => set({ isTemplateLoading }),
  setTemplateError: (templateError) => set({ templateError }),
  setFormValues: (formValues) => set({ formValues }),
  setContestants: (contestantsOrUpdater) =>
    set((state) => ({
      contestants:
        typeof contestantsOrUpdater === "function"
          ? contestantsOrUpdater(state.contestants)
          : contestantsOrUpdater,
    })),

  updateFieldValue: (fieldKey, value) =>
    set((state) => {
      const next = {
        ...state.formValues,
        [fieldKey]: value,
      };

      if (!state.template) return { formValues: next };

      const changedField = state.template.fields.find(
        (field) => field.key === fieldKey,
      );
      if (!changedField) return { formValues: next };

      for (const field of state.template.fields) {
        if (field.sortOrder > changedField.sortOrder) {
          delete next[field.key];
        }
      }

      return { formValues: next };
    }),

  setCurrentTab: (currentTab) => set({ currentTab }),

  addJudge: (judge) =>
    set((state) => ({
      judges: [...state.judges, { ...judge, id: Date.now() + Math.random() }],
    })),

  removeJudge: (judgeId) =>
    set((state) => ({
      judges: state.judges.filter((judge) => judge.id !== judgeId),
    })),

  updateJudge: (judgeId, updatedJudge) =>
    set((state) => ({
      judges: state.judges.map((judge) =>
        judge.id === judgeId ? { ...judge, ...updatedJudge } : judge,
      ),
    })),

  addContestant: (contestant) =>
    set((state) => ({
      contestants: [
        ...state.contestants,
        {
          ...contestant,
          id: Date.now() + Math.random(),
          delegation: contestant.delegation ?? contestant.teamName ?? "",
          teamName: contestant.teamName ?? contestant.delegation ?? "",
        },
      ],
    })),

  removeContestant: (contestantId) =>
    set((state) => ({
      contestants: state.contestants.filter(
        (contestant) => contestant.id !== contestantId,
      ),
    })),

  updateContestant: (contestantId, updatedContestant) =>
    set((state) => ({
      contestants: state.contestants.map((contestant) =>
        contestant.id === contestantId
          ? { ...contestant, ...updatedContestant }
          : contestant,
      ),
    })),
}));
