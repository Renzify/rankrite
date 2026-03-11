import { useEffect, useMemo } from "react";
import { getTemplateByName, getTemplateCatalog } from "../api/templateApi";
import { useTemplateStore } from "../stores/templateStore";

function normalizeEventTypeLabel(value) {
  if (!value) return "";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatFieldLabel(key) {
  if (!key) return "";
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isConditionMet(condition, fields, values) {
  const parentField = fields.find(
    (field) => field.id === condition.parentFieldId,
  );
  if (!parentField) return false;

  const selectedParentValue = values[parentField.key];
  if (!selectedParentValue) return false;

  const requiredOption = parentField.options?.find(
    (option) => option.id === condition.parentOptionId,
  );
  if (!requiredOption) return false;

  return selectedParentValue === requiredOption.value;
}

export function useDynamicTemplate() {
  const catalog = useTemplateStore((state) => state.catalog);
  const isCatalogLoading = useTemplateStore((state) => state.isCatalogLoading);
  const catalogError = useTemplateStore((state) => state.catalogError);
  const selectedEventType = useTemplateStore(
    (state) => state.selectedEventType,
  );
  const selectedSport = useTemplateStore((state) => state.selectedSport);
  const template = useTemplateStore((state) => state.template);
  const formValues = useTemplateStore((state) => state.formValues);
  const isTemplateLoading = useTemplateStore(
    (state) => state.isTemplateLoading,
  );
  const templateError = useTemplateStore((state) => state.templateError);

  const setCatalog = useTemplateStore((state) => state.setCatalog);
  const setCatalogLoading = useTemplateStore(
    (state) => state.setCatalogLoading,
  );
  const setCatalogError = useTemplateStore((state) => state.setCatalogError);
  const setSelectedEventType = useTemplateStore(
    (state) => state.setSelectedEventType,
  );
  const setSelectedSport = useTemplateStore((state) => state.setSelectedSport);
  const setTemplate = useTemplateStore((state) => state.setTemplate);
  const clearTemplate = useTemplateStore((state) => state.clearTemplate);
  const setTemplateLoading = useTemplateStore(
    (state) => state.setTemplateLoading,
  );
  const setTemplateError = useTemplateStore((state) => state.setTemplateError);
  const updateFieldValue = useTemplateStore((state) => state.updateFieldValue);
  const setFormValues = useTemplateStore((state) => state.setFormValues);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const data = await getTemplateCatalog();
        if (!isMounted) return;
        setCatalog(data);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch template catalog:", error);
        setCatalogError("Failed to fetch template catalog.");
      } finally {
        if (isMounted) setCatalogLoading(false);
      }
    };

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [setCatalog, setCatalogError, setCatalogLoading]);

  const eventTypeOptions = useMemo(() => {
    const values = [...new Set(catalog.map((item) => item.eventType))];
    return values.map((value) => ({
      value,
      label: normalizeEventTypeLabel(value),
    }));
  }, [catalog]);

  const sportOptions = useMemo(() => {
    if (!selectedEventType) return [];

    const items = catalog.filter(
      (item) => item.eventType === selectedEventType,
    );
    const mapped = items.flatMap((item) =>
      (item.sports ?? []).map((sport) => ({
        value: sport.value,
        label: sport.label,
        templateName: item.name,
        sportCount: (item.sports ?? []).length,
      })),
    );

    const bestBySportValue = new Map();
    for (const option of mapped) {
      const existing = bestBySportValue.get(option.value);
      if (!existing || option.sportCount < existing.sportCount) {
        bestBySportValue.set(option.value, option);
      }
    }

    return [...bestBySportValue.values()];
  }, [catalog, selectedEventType]);

  useEffect(() => {
    if (!selectedSport) {
      clearTemplate();
      return;
    }

    const selectedSportOption = sportOptions.find(
      (option) => option.value === selectedSport,
    );

    if (!selectedSportOption) {
      clearTemplate();
      return;
    }

    let isMounted = true;

    const loadTemplate = async () => {
      setTemplateLoading(true);
      setTemplateError(null);
      try {
        const data = await getTemplateByName(selectedSportOption.templateName);
        if (!isMounted) return;

        const sortedFields = [...data.fields].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
        setTemplate({ ...data, fields: sortedFields });
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch template:", error);
        clearTemplate();
        setTemplateError("Failed to fetch template.");
      } finally {
        if (isMounted) setTemplateLoading(false);
      }
    };

    loadTemplate();

    return () => {
      isMounted = false;
    };
  }, [
    clearTemplate,
    selectedSport,
    setTemplate,
    setTemplateError,
    setTemplateLoading,
    sportOptions,
  ]);

  const visibleFields = useMemo(() => {
    if (!template) return [];

    return template.fields.filter((field) => {
      if (field.key === "sport") return false;
      if (!field.conditions?.length) return true;

      return field.conditions.some((condition) =>
        isConditionMet(condition, template.fields, formValues),
      );
    });
  }, [template, formValues]);

  const getFilteredOptions = (field) => {
    const options = field.options ?? [];
    const dependencies = field.optionDependencies ?? [];

    if (!dependencies.length || !template) return options;

    return options.filter((option) => {
      const optionDeps = dependencies.filter(
        (dependency) => dependency.childOptionId === option.id,
      );
      if (!optionDeps.length) return false;

      return optionDeps.some((dependency) =>
        isConditionMet(
          {
            parentFieldId: dependency.parentFieldId,
            parentOptionId: dependency.parentOptionId,
          },
          template.fields,
          formValues,
        ),
      );
    });
  };

  return {
    catalog,
    isCatalogLoading,
    catalogError,
    selectedEventType,
    selectedSport,
    template,
    formValues,
    isTemplateLoading,
    templateError,
    eventTypeOptions,
    sportOptions,
    visibleFields,
    setSelectedEventType,
    setSelectedSport,
    updateFieldValue,
    setFormValues,
    getFilteredOptions,
  };
}
