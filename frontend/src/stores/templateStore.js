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
}));

