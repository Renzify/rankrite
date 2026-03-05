import { db } from "../index.ts"; // your drizzle db instance
import {
  eventTemplate,
  templateField,
  templateFieldOption,
  templateFieldCondition,
  templateOptionDependency,
} from "../schema.ts"; // adjust to your path

export async function seedGymnasticsTemplate() {
  // 1️⃣ Create the event template
  const [template] = await db
    .insert(eventTemplate)
    .values({
      name: "Gymnastics Template",
      eventType: "sports",
      description:
        "Dynamic gymnastics template supporting multiple disciplines, levels, and apparatus types.",
    })
    .returning();

  // 2️⃣ Define base fields
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
        key: "apparatus",
        label: "Select Apparatus",
        fieldType: "select",
        sortOrder: 6,
      },
    ])
    .returning();

  const getField = (key: string) => fields.find((f) => f.key === key)!;

  // 3️⃣ Add options
  const options = await db
    .insert(templateFieldOption)
    .values([
      // sport
      {
        fieldId: getField("sport").id,
        value: "gymnastics",
        label: "Gymnastics",
      },
      {
        fieldId: getField("sport").id,
        value: "dance_sports",
        label: "Dance Sports",
      },
      { fieldId: getField("sport").id, value: "arnis", label: "Arnis" },

      // competition levels
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

      // division class
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

      // age class
      {
        fieldId: getField("age_class").id,
        value: "pre_junior",
        label: "Pre-Junior",
      },
      { fieldId: getField("age_class").id, value: "junior", label: "Junior" },
      {
        fieldId: getField("age_class").id,
        value: "developmental",
        label: "Developmental",
      },
      { fieldId: getField("age_class").id, value: "hopes", label: "Hopes" },

      // discipline
      {
        fieldId: getField("discipline").id,
        value: "aerobic",
        label: "Aerobic Gymnastics",
      },
      {
        fieldId: getField("discipline").id,
        value: "mens_artistic",
        label: "Men's Artistic Gymnastics",
      },
      {
        fieldId: getField("discipline").id,
        value: "womens_artistic",
        label: "Women's Artistic Gymnastics",
      },
      {
        fieldId: getField("discipline").id,
        value: "rhythmic",
        label: "Rhythmic Gymnastics",
      },

      // apparatus (all possible, will be filtered by dependencies)
      {
        fieldId: getField("apparatus").id,
        value: "freehand",
        label: "Freehand",
      },
      { fieldId: getField("apparatus").id, value: "ball", label: "Ball" },
      { fieldId: getField("apparatus").id, value: "clubs", label: "Clubs" },
      { fieldId: getField("apparatus").id, value: "ribbon", label: "Ribbon" },
      { fieldId: getField("apparatus").id, value: "rope", label: "Rope" },
      { fieldId: getField("apparatus").id, value: "hoop", label: "Hoop" },
      { fieldId: getField("apparatus").id, value: "vault", label: "Vault" },
      {
        fieldId: getField("apparatus").id,
        value: "mushroom",
        label: "Mushroom",
      },
      {
        fieldId: getField("apparatus").id,
        value: "floor_exercise",
        label: "Floor Exercise",
      },
      {
        fieldId: getField("apparatus").id,
        value: "high_bar",
        label: "High Bar",
      },
      {
        fieldId: getField("apparatus").id,
        value: "balance_beam",
        label: "Balance Beam",
      },
      {
        fieldId: getField("apparatus").id,
        value: "individual_men",
        label: "Individual Men",
      },
      {
        fieldId: getField("apparatus").id,
        value: "individual_women",
        label: "Individual Women",
      },
      {
        fieldId: getField("apparatus").id,
        value: "mixed_pair",
        label: "Mixed Pair",
      },
      { fieldId: getField("apparatus").id, value: "trio", label: "Trio" },
    ])
    .returning();

  const getOption = (fieldKey: string, value: string) =>
    options.find(
      (o) => o.fieldId === getField(fieldKey).id && o.value === value,
    )!;

  // 4️⃣ Conditional display logic
  await db.insert(templateFieldCondition).values([
    // Show division_class if competition_level is any of these:
    ...["school_level", "division_level", "regional_level", "palaro_level"].map(
      (val) => ({
        childFieldId: getField("division_class").id,
        parentFieldId: getField("competition_level").id,
        parentOptionId: getOption("competition_level", val).id,
      }),
    ),

    // Show age_class if batang pinoy or gap
    ...["batang_pinoy_level", "gap_competition"].map((val) => ({
      childFieldId: getField("age_class").id,
      parentFieldId: getField("competition_level").id,
      parentOptionId: getOption("competition_level", val).id,
    })),
  ]);

  // 5️⃣ Apparatus dependencies by discipline
  const deps: Record<string, string[]> = {
    rhythmic: ["freehand", "ball", "clubs", "ribbon", "rope", "hoop"],
    aerobic: ["individual_men", "individual_women", "mixed_pair", "trio"],
    mens_artistic: ["vault", "mushroom", "floor_exercise", "high_bar"],
    womens_artistic: ["floor_exercise", "vault", "balance_beam", "high_bar"],
  };

  const depInserts = Object.entries(deps).flatMap(
    ([discipline, apparatusList]) =>
      apparatusList.map((app) => ({
        childFieldId: getField("apparatus").id,
        childOptionId: getOption("apparatus", app).id,
        parentFieldId: getField("discipline").id,
        parentOptionId: getOption("discipline", discipline).id,
      })),
  );

  await db.insert(templateOptionDependency).values(depInserts);

  console.log("✅ Gymnastics Template Seeded Successfully");
}
