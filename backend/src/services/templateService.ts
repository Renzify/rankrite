import { db } from "../db/index.ts";
import {
  eventTemplate,
  templateField,
  templateFieldOption,
  templateFieldCondition,
} from "../db/schema.ts";

import { eq } from "drizzle-orm";

export async function getTemplateByName(name: string) {
  const template = await db.query.eventTemplate.findFirst({
    where: eq(eventTemplate.name, name),
  });

  if (!template) return null;

  const fields = await db.query.templateField.findMany({
    where: eq(templateField.templateId, template.id),
  });

  const fieldIds = fields.map((f) => f.id);

  const options = await db.query.templateFieldOption.findMany({
    where: (table, { inArray }) => inArray(table.fieldId, fieldIds),
  });

  const conditions = await db.query.templateFieldCondition.findMany({
    where: (table, { inArray }) => inArray(table.childFieldId, fieldIds),
  });

  // assemble response
  const fieldsMap = fields.map((field) => ({
    ...field,
    options: options.filter((o) => o.fieldId === field.id),
    conditions: conditions.filter((c) => c.childFieldId === field.id),
  }));

  return {
    ...template,
    fields: fieldsMap,
  };
}
