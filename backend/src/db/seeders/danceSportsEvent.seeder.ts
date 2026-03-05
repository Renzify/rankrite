import { db } from "../index.ts";
import {
  eventTemplate,
  templateField,
  templateFieldOption,
  templateFieldCondition,
  templateOptionDependency,
} from "../schema.ts";

export async function seedDanceSportsTemplate() {
  const [template] = await db
    .insert(eventTemplate)
    .values({
      name: "Dance Sports Template",
      eventType: "sports",
      description:
        "Dynamic dance sports template supporting levels, disciplines, and style categories.",
    })
    .returning();

  const fields = await db
    .insert(templateField)
    .values([
      {
        templateId: template.id,
        key: "sport",
        label: "Select Sport",
        fieldType: "select",
        sortOrder: 1,
      },
      {
        templateId: template.id,
        key: "competition_level",
        label: "Select Competition Level",
        fieldType: "select",
        sortOrder: 2,
      },
      {
        templateId: template.id,
        key: "division_class",
        label: "Select Division Class",
        fieldType: "select",
        sortOrder: 3,
      },
      {
        templateId: template.id,
        key: "age_class",
        label: "Select Age Class",
        fieldType: "select",
        sortOrder: 4,
      },
      {
        templateId: template.id,
        key: "discipline",
        label: "Select Discipline",
        fieldType: "select",
        sortOrder: 5,
      },
      {
        templateId: template.id,
        key: "category",
        label: "Select Category",
        fieldType: "select",
        sortOrder: 6,
      },
      {
        templateId: template.id,
        key: "style",
        label: "Select Style",
        fieldType: "select",
        sortOrder: 7,
      },
    ])
    .returning();

  const getField = (key: string) => fields.find((f) => f.key === key)!;

  const options = await db
    .insert(templateFieldOption)
    .values([
      {
        fieldId: getField("sport").id,
        value: "dance_sports",
        label: "Dance Sports",
      },

      {
        fieldId: getField("competition_level").id,
        value: "school_level",
        label: "School Level",
      },
      {
        fieldId: getField("competition_level").id,
        value: "division_level",
        label: "Division Level",
      },
      {
        fieldId: getField("competition_level").id,
        value: "regional_level",
        label: "Regional Level",
      },
      {
        fieldId: getField("competition_level").id,
        value: "palaro_level",
        label: "Palarong Pambansa Level",
      },
      {
        fieldId: getField("competition_level").id,
        value: "batang_pinoy_level",
        label: "Batang Pinoy Level",
      },
      {
        fieldId: getField("competition_level").id,
        value: "gap_competition",
        label: "GAP Competition",
      },

      {
        fieldId: getField("division_class").id,
        value: "elementary",
        label: "Elementary",
      },
      {
        fieldId: getField("division_class").id,
        value: "secondary",
        label: "Secondary",
      },

      {
        fieldId: getField("age_class").id,
        value: "pre_junior",
        label: "Pre-Junior",
      },
      { fieldId: getField("age_class").id, value: "junior", label: "Junior" },
      { fieldId: getField("age_class").id, value: "youth", label: "Youth" },
      { fieldId: getField("age_class").id, value: "adult", label: "Adult" },

      {
        fieldId: getField("discipline").id,
        value: "standard",
        label: "Standard",
      },
      {
        fieldId: getField("discipline").id,
        value: "latin",
        label: "Latin",
      },
      {
        fieldId: getField("discipline").id,
        value: "breaking",
        label: "Breaking",
      },

      { fieldId: getField("category").id, value: "solo", label: "Solo" },
      { fieldId: getField("category").id, value: "duo", label: "Duo" },
      { fieldId: getField("category").id, value: "group", label: "Group" },

      { fieldId: getField("style").id, value: "waltz", label: "Waltz" },
      { fieldId: getField("style").id, value: "tango", label: "Tango" },
      { fieldId: getField("style").id, value: "foxtrot", label: "Foxtrot" },
      {
        fieldId: getField("style").id,
        value: "quickstep",
        label: "Quickstep",
      },
      { fieldId: getField("style").id, value: "cha_cha", label: "Cha-Cha" },
      { fieldId: getField("style").id, value: "rumba", label: "Rumba" },
      { fieldId: getField("style").id, value: "samba", label: "Samba" },
      { fieldId: getField("style").id, value: "jive", label: "Jive" },
      {
        fieldId: getField("style").id,
        value: "breaking_battle",
        label: "Breaking Battle",
      },
      {
        fieldId: getField("style").id,
        value: "showcase",
        label: "Showcase",
      },
    ])
    .returning();

  const getOption = (fieldKey: string, value: string) =>
    options.find(
      (o) => o.fieldId === getField(fieldKey).id && o.value === value,
    )!;

  await db.insert(templateFieldCondition).values([
    {
      childFieldId: getField("competition_level").id,
      parentFieldId: getField("sport").id,
      parentOptionId: getOption("sport", "dance_sports").id,
    },
    {
      childFieldId: getField("discipline").id,
      parentFieldId: getField("sport").id,
      parentOptionId: getOption("sport", "dance_sports").id,
    },
    ...["school_level", "division_level", "regional_level", "palaro_level"].map(
      (val) => ({
        childFieldId: getField("division_class").id,
        parentFieldId: getField("competition_level").id,
        parentOptionId: getOption("competition_level", val).id,
      }),
    ),
    ...["batang_pinoy_level", "gap_competition"].map((val) => ({
      childFieldId: getField("age_class").id,
      parentFieldId: getField("competition_level").id,
      parentOptionId: getOption("competition_level", val).id,
    })),
    ...["standard", "latin", "breaking"].map((val) => ({
      childFieldId: getField("category").id,
      parentFieldId: getField("discipline").id,
      parentOptionId: getOption("discipline", val).id,
    })),
    ...["standard", "latin", "breaking"].map((val) => ({
      childFieldId: getField("style").id,
      parentFieldId: getField("discipline").id,
      parentOptionId: getOption("discipline", val).id,
    })),
  ]);

  const deps: Record<string, { field: "category" | "style"; value: string }[]> =
    {
      standard: [
        { field: "category", value: "duo" },
        { field: "category", value: "group" },
        { field: "style", value: "waltz" },
        { field: "style", value: "tango" },
        { field: "style", value: "foxtrot" },
        { field: "style", value: "quickstep" },
      ],
      latin: [
        { field: "category", value: "duo" },
        { field: "category", value: "group" },
        { field: "style", value: "cha_cha" },
        { field: "style", value: "rumba" },
        { field: "style", value: "samba" },
        { field: "style", value: "jive" },
      ],
      breaking: [
        { field: "category", value: "solo" },
        { field: "category", value: "duo" },
        { field: "style", value: "breaking_battle" },
        { field: "style", value: "showcase" },
      ],
    };

  const depInserts = Object.entries(deps).flatMap(([discipline, pairs]) =>
    pairs.map((pair) => ({
      childFieldId: getField(pair.field).id,
      childOptionId: getOption(pair.field, pair.value).id,
      parentFieldId: getField("discipline").id,
      parentOptionId: getOption("discipline", discipline).id,
    })),
  );

  await db.insert(templateOptionDependency).values(depInserts);
}

