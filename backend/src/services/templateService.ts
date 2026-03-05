import { db } from "../db/index.ts";
import {
  eventTemplate,
  templateField,
  templateFieldOption,
  templateFieldCondition,
  templateOptionDependency,
} from "../db/schema.ts";

import { eq, inArray } from "drizzle-orm";

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
