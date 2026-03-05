import { inArray } from "drizzle-orm";
import { db } from "../src/db/index.ts";
import {
  eventTemplate,
  templateField,
  templateFieldCondition,
  templateFieldOption,
  templateOptionDependency,
} from "../src/db/schema.ts";
import { seedGymnasticsTemplate } from "../src/db/seeders/gymnasticEvent.seeder.ts";
import { seedArnisTemplate } from "../src/db/seeders/arnisEvent.seeder.ts";
import { seedDanceSportsTemplate } from "../src/db/seeders/danceSportsEvent.seeder.ts";

const TEMPLATE_NAMES = [
  "Gymnastics Template",
  "Arnis Template",
  "Dance Sports Template",
] as const;

async function removeExistingTemplates() {
  const templates = await db
    .select({ id: eventTemplate.id, name: eventTemplate.name })
    .from(eventTemplate)
    .where(inArray(eventTemplate.name, [...TEMPLATE_NAMES]));

  if (!templates.length) {
    console.log("No matching templates found. Skipping delete step.");
    return;
  }

  const templateIds = templates.map((template) => template.id);
  const fieldIds = (
    await db
      .select({ id: templateField.id })
      .from(templateField)
      .where(inArray(templateField.templateId, templateIds))
  ).map((field) => field.id);

  if (fieldIds.length) {
    await db
      .delete(templateOptionDependency)
      .where(inArray(templateOptionDependency.childFieldId, fieldIds));
    await db
      .delete(templateFieldCondition)
      .where(inArray(templateFieldCondition.childFieldId, fieldIds));
    await db
      .delete(templateFieldOption)
      .where(inArray(templateFieldOption.fieldId, fieldIds));
    await db.delete(templateField).where(inArray(templateField.id, fieldIds));
  }

  await db.delete(eventTemplate).where(inArray(eventTemplate.id, templateIds));

  console.log(`Removed ${templates.length} existing template row(s).`);
}

async function reseedTemplates() {
  await seedGymnasticsTemplate();
  await seedArnisTemplate();
  await seedDanceSportsTemplate();
}

async function main() {
  console.log("Refreshing sports templates...");

  try {
    await removeExistingTemplates();
    await reseedTemplates();
    console.log("Templates refreshed successfully.");
  } catch (error) {
    console.error("Template refresh failed:", error);
    process.exitCode = 1;
  } finally {
    await db.$client?.end?.();
  }
}

main();

