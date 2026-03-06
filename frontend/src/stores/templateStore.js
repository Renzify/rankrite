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

  // Event state
  eventId: "",
  eventTitle: "",

  // Active " tab:details" | "judges" | "contestants"
  activeTab: "details",

  // Judges list
  judges: [],

  // Contestants list
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
    }),

  setSelectedSport: (selectedSport) =>
    set({
      selectedSport,
      template: null,
      formValues: {},
      templateError: null,
    }),

  setTemplate: (template) =>
    set((state) => ({
      template,
      formValues: state.selectedSport ? { sport: state.selectedSport } : {},
    })),
  clearTemplate: () => set({ template: null, formValues: {} }),
  setTemplateLoading: (isTemplateLoading) => set({ isTemplateLoading }),
  setTemplateError: (templateError) => set({ templateError }),

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

  // Event actions
  setEventId: (eventId) => set({ eventId }),
  setEventTitle: (eventTitle) => set({ eventTitle }),
  setActiveTab: (activeTab) => set({ activeTab }),

  // Judge actions
  addJudge: (judge) =>
    set((state) => ({
      judges: [...state.judges, judge],
    })),

  removeJudge: (judgeId) =>
    set((state) => ({
      judges: state.judges.filter((j) => j.id !== judgeId),
    })),

  // Contestant actions
  addContestant: (contestant) =>
    set((state) => ({
      contestants: [...state.contestants, contestant],
    })),

  removeContestant: (contestantId) =>
    set((state) => ({
      contestants: state.contestants.filter((c) => c.id !== contestantId),
    })),

  // Reset all data
  resetEvent: () =>
    set({
      eventId: "",
      eventTitle: "",
      activeTab: "details",
      judges: [],
      contestants: [],
    }),
}));
