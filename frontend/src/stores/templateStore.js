import { create } from "zustand";

const getEmptyEventDraftState = () => ({
  selectedEventType: "",
  selectedSport: "",
  template: null,
  formValues: {},
  isTemplateLoading: false,
  templateError: null,
  currentTab: "details",
  judges: [],
  contestants: [],
});

export const useTemplateStore = create((set) => ({
  catalog: [],
  isCatalogLoading: false,
  catalogError: null,

  ...getEmptyEventDraftState(),

  setCatalog: (catalog) => set({ catalog }),
  setCatalogLoading: (isCatalogLoading) => set({ isCatalogLoading }),
  setCatalogError: (catalogError) => set({ catalogError }),

  resetEventDraftState: () => set(getEmptyEventDraftState()),

  setSelectedEventType: (selectedEventType) =>
    set({
      ...getEmptyEventDraftState(),
      selectedEventType,
    }),

  setSelectedSport: (selectedSport) =>
    set({
      template: null,
      formValues: {},
      selectedSport,
      isTemplateLoading: false,
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
      isTemplateLoading: false,
      currentTab: "details",
      judges: [],
      contestants: [],
    }),
  setTemplateLoading: (isTemplateLoading) => set({ isTemplateLoading }),
  setTemplateError: (templateError) => set({ templateError }),
  setFormValues: (formValues) => set({ formValues }),

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

  setJudges: (judges) =>
    set((state) => ({
      judges: typeof judges === "function" ? judges(state.judges) : judges,
    })),

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

  setContestants: (contestants) =>
    set((state) => ({
      contestants:
        typeof contestants === "function"
          ? contestants(state.contestants)
          : contestants,
    })),

  addContestant: (contestant) =>
    set((state) => ({
      contestants: [
        ...state.contestants,
        { ...contestant, id: Date.now() + Math.random() },
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
