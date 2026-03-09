import { db } from "../db/index.ts";
import {
  eventTemplate,
  templateField,
  templateFieldOption,
  templateFieldCondition,
  templateOptionDependency,
} from "../db/schema.ts";

import { eq, inArray } from "drizzle-orm";

export type CreateTemplateFieldInput = {
  key: string;
  label: string;
  fieldType: "select" | "text" | "number";
  isRequired?: boolean;
  options?: Array<{ value: string; label: string }>;
};

export type CreateTemplateInput = {
  name: string;
  eventType: string;
  description?: string;
  sportValue: string;
  sportLabel: string;
  fields?: CreateTemplateFieldInput[];
};

async function buildTemplatePayload(template: typeof eventTemplate.$inferSelect) {
  const fields = await db.query.templateField.findMany({
    where: eq(templateField.templateId, template.id),
  });

  const fieldIds = fields.map((f) => f.id);

  const options =
    fieldIds.length === 0
      ? []
      : await db.query.templateFieldOption.findMany({
          where: (table) => inArray(table.fieldId, fieldIds),
        });

  const conditions =
    fieldIds.length === 0
      ? []
      : await db.query.templateFieldCondition.findMany({
          where: (table) => inArray(table.childFieldId, fieldIds),
        });

  const optionDependencies =
    fieldIds.length === 0
      ? []
      : await db.query.templateOptionDependency.findMany({
          where: (table) => inArray(table.childFieldId, fieldIds),
        });

  const fieldsMap = fields.map((field) => ({
    ...field,
    options: options.filter((o) => o.fieldId === field.id),
    conditions: conditions.filter((c) => c.childFieldId === field.id),
    optionDependencies: optionDependencies.filter(
      (dependency) => dependency.childFieldId === field.id,
    ),
  }));

  return {
    ...template,
    fields: fieldsMap,
  };
}

export async function getTemplateByName(name: string) {
  const template = await db.query.eventTemplate.findFirst({
    where: eq(eventTemplate.name, name),
  });

  if (!template) return null;

  return buildTemplatePayload(template);
}

export async function getTemplateCatalog() {
  const templates = await db.query.eventTemplate.findMany({
    where: eq(eventTemplate.isActive, true),
  });

  if (templates.length === 0) return [];

  const templateIds = templates.map((template) => template.id);
  const fields = await db.query.templateField.findMany({
    where: (table) => inArray(table.templateId, templateIds),
  });

  const fieldIds = fields.map((field) => field.id);
  const options =
    fieldIds.length === 0
      ? []
      : await db.query.templateFieldOption.findMany({
          where: (table) => inArray(table.fieldId, fieldIds),
        });

  return templates.map((template) => {
    const templateFields = fields.filter((field) => field.templateId === template.id);
    const sportField = templateFields.find((field) => field.key === "sport");
    const sportOptions = sportField
      ? options
          .filter((option) => option.fieldId === sportField.id)
          .map((option) => ({ value: option.value, label: option.label }))
      : [];

    return {
      id: template.id,
      name: template.name,
      eventType: template.eventType,
      description: template.description,
      sports: sportOptions,
    };
  });
}

export async function createTemplate(input: CreateTemplateInput) {
  const name = input.name?.trim();
  const eventType = input.eventType?.trim();
  const description = input.description?.trim() || null;
  const sportValue = input.sportValue?.trim();
  const sportLabel = input.sportLabel?.trim();

  if (!name || !eventType || !sportValue || !sportLabel) {
    throw new Error("INVALID_TEMPLATE_INPUT");
  }

  const existingTemplate = await db.query.eventTemplate.findFirst({
    where: eq(eventTemplate.name, name),
  });

  if (existingTemplate) {
    throw new Error("TEMPLATE_NAME_EXISTS");
  }

  const [template] = await db
    .insert(eventTemplate)
    .values({
      name,
      eventType,
      description,
      isActive: true,
    })
    .returning();

  const customFields = (input.fields ?? []).map((field) => ({
    key: field.key.trim(),
    label: field.label.trim(),
    fieldType: field.fieldType,
    isRequired: field.isRequired ?? true,
    options: field.options ?? [],
  }));

  const fieldsToInsert = [
    {
      templateId: template.id,
      key: "sport",
      label: "Select Sport",
      fieldType: "select" as const,
      sortOrder: 1,
      isRequired: true,
    },
    ...customFields.map((field, index) => ({
      templateId: template.id,
      key: field.key,
      label: field.label,
      fieldType: field.fieldType,
      sortOrder: index + 2,
      isRequired: field.isRequired,
    })),
  ];

  const insertedFields = await db
    .insert(templateField)
    .values(fieldsToInsert)
    .returning();

  const getFieldByKey = (key: string) =>
    insertedFields.find((field) => field.key === key);

  const optionRows: Array<{
    fieldId: string;
    value: string;
    label: string;
    sortOrder: number;
  }> = [];

  const sportField = getFieldByKey("sport");
  if (sportField) {
    optionRows.push({
      fieldId: sportField.id,
      value: sportValue,
      label: sportLabel,
      sortOrder: 1,
    });
  }

  customFields.forEach((field) => {
    if (field.fieldType !== "select") return;

    const matchingField = getFieldByKey(field.key);
    if (!matchingField) return;

    field.options.forEach((option, index) => {
      const value = option.value.trim();
      const label = option.label.trim();

      if (!value || !label) return;

      optionRows.push({
        fieldId: matchingField.id,
        value,
        label,
        sortOrder: index + 1,
      });
    });
  });

  if (optionRows.length) {
    await db.insert(templateFieldOption).values(optionRows);
  }

  return buildTemplatePayload(template);
}
