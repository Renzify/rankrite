import { db } from "../index.ts";
import {
  eventTemplate,
  templateField,
  templateFieldOption,
  templateFieldCondition,
  templateOptionDependency,
} from "../schema.ts";

export async function seedArnisTemplate() {
  const [template] = await db
    .insert(eventTemplate)
    .values({
      name: "Arnis Template",
      eventType: "sports",
      description:
        "Dynamic arnis template supporting levels, disciplines, and weapon divisions.",
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
        key: "weapon_division",
        label: "Select Weapon Division",
        fieldType: "select",
        sortOrder: 7,
      },
    ])
    .returning();

  const getField = (key: string) => fields.find((f) => f.key === key)!;

  const options = await db
    .insert(templateFieldOption)
    .values([
      { fieldId: getField("sport").id, value: "arnis", label: "Arnis" },

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
      { fieldId: getField("age_class").id, value: "senior", label: "Senior" },

      {
        fieldId: getField("discipline").id,
        value: "anyo",
        label: "Anyo",
      },
      {
        fieldId: getField("discipline").id,
        value: "laban",
        label: "Laban",
      },

      {
        fieldId: getField("category").id,
        value: "solo",
        label: "Solo",
      },
      {
        fieldId: getField("category").id,
        value: "double",
        label: "Double",
      },
      {
        fieldId: getField("category").id,
        value: "team",
        label: "Team",
      },
      {
        fieldId: getField("category").id,
        value: "individual",
        label: "Individual",
      },

      {
        fieldId: getField("weapon_division").id,
        value: "padded_stick",
        label: "Padded Stick",
      },
      {
        fieldId: getField("weapon_division").id,
        value: "live_stick",
        label: "Live Stick",
      },
      {
        fieldId: getField("weapon_division").id,
        value: "espada_y_daga",
        label: "Espada y Daga",
      },
      {
        fieldId: getField("weapon_division").id,
        value: "knife",
        label: "Knife",
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
      parentOptionId: getOption("sport", "arnis").id,
    },
    {
      childFieldId: getField("discipline").id,
      parentFieldId: getField("sport").id,
      parentOptionId: getOption("sport", "arnis").id,
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
    ...["anyo", "laban"].map((val) => ({
      childFieldId: getField("category").id,
      parentFieldId: getField("discipline").id,
      parentOptionId: getOption("discipline", val).id,
    })),
    ...["anyo", "laban"].map((val) => ({
      childFieldId: getField("weapon_division").id,
      parentFieldId: getField("discipline").id,
      parentOptionId: getOption("discipline", val).id,
    })),
  ]);

  const deps: Record<string, { field: "category" | "weapon_division"; value: string }[]> =
    {
      anyo: [
        { field: "category", value: "solo" },
        { field: "category", value: "double" },
        { field: "category", value: "team" },
        { field: "weapon_division", value: "padded_stick" },
        { field: "weapon_division", value: "espada_y_daga" },
        { field: "weapon_division", value: "knife" },
      ],
      laban: [
        { field: "category", value: "individual" },
        { field: "category", value: "team" },
        { field: "weapon_division", value: "padded_stick" },
        { field: "weapon_division", value: "live_stick" },
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

