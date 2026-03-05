import express from "express";
import { db } from "../db/index.ts";
import {
  eventTemplate,
  templateField,
  templateFieldOption,
  templateFieldCondition,
  templateOptionDependency,
} from "../db/schema.ts";
import { eq, inArray } from "drizzle-orm";

export const templateRouter = express.Router();

// GET /api/templates/:name
templateRouter.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;

    const [template] = await db
      .select()
      .from(eventTemplate)
      .where(eq(eventTemplate.name, name));

    if (!template) return res.status(404).json({ error: "Template not found" });

    const fields = await db
      .select()
      .from(templateField)
      .where(eq(templateField.templateId, template.id))
      .orderBy(templateField.sortOrder);

    const fieldIds = fields.map((f) => f.id);

    const [options, conditions, dependencies] = await Promise.all([
      db
        .select()
        .from(templateFieldOption)
        .where(inArray(templateFieldOption.fieldId, fieldIds)),
      db
        .select()
        .from(templateFieldCondition)
        .where(inArray(templateFieldCondition.childFieldId, fieldIds)),
      db
        .select()
        .from(templateOptionDependency)
        .where(inArray(templateOptionDependency.childFieldId, fieldIds)),
    ]);

    res.json({ template, fields, options, conditions, dependencies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load template" });
  }
});
