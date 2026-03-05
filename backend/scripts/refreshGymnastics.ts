// scripts/refresh-gymnastics.ts
import { db } from "../src/db";
import {
  eventTemplate,
  templateField,
  templateFieldOption,
  templateFieldCondition,
  templateOptionDependency,
} from "../src/db/schema.ts";
import { eq, inArray } from "drizzle-orm";

async function main() {
  console.log("🧹 Refreshing Gymnastics Template Data...");

  try {
    // 1️⃣ Find the template
    const [template] = await db
      .select()
      .from(eventTemplate)
      .where(eq(eventTemplate.name, "Gymnastics Template"));

    if (!template) {
      console.log("⚠️ No Gymnastics Template found — nothing to refresh.");
      process.exit(0);
    }

    const templateId = template.id;

    // 2️⃣ Get all field IDs for this template
    const fieldIds = (
      await db
        .select({ id: templateField.id })
        .from(templateField)
        .where(eq(templateField.templateId, templateId))
    ).map((f) => f.id);

    if (fieldIds.length === 0) {
      console.log("⚠️ Template found but no fields to remove.");
    } else {
      // 3️⃣ Delete dependencies in correct order
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

    // 4️⃣ Finally, remove the template itself
    await db.delete(eventTemplate).where(eq(eventTemplate.id, templateId));

    console.log(
      "✅ Gymnastics Template and related data removed successfully.",
    );
  } catch (err) {
    console.error("❌ Error refreshing Gymnastics template:", err);
  } finally {
    await db.$client?.end?.();
    process.exit(0);
  }
}

main();
