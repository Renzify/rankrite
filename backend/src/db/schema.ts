import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  serial,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/*
  Application Users (authentication)
*/

export const user = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    profilePic: text("profile_pic"),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  }),
);

/*
  Template
  Defines the event creation flow dynamically
*/

export const eventTemplate = pgTable("event_template", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // Gymnastics Template, Pageant Template
  eventType: text("event_type").notNull(), // sports | pageant
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const templateField = pgTable(
  "template_field",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    templateId: uuid("template_id")
      .notNull()
      .references(() => eventTemplate.id, { onDelete: "cascade" }),

    key: text("key").notNull(), // sport, competition_level, discipline, apparatus
    label: text("label").notNull(), // Select Sport
    fieldType: text("field_type").notNull(), // select | text | number | multi_select
    placeholder: text("placeholder"),
    helpText: text("help_text"),

    sortOrder: integer("sort_order").notNull().default(1),
    isRequired: boolean("is_required").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),

    // optional extra UI settings
    config: jsonb("config"), // e.g. { "allowMultiple": true }

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    templateKeyUnique: uniqueIndex("template_field_template_key_unique").on(
      table.templateId,
      table.key,
    ),
  }),
);

export const templateFieldOption = pgTable("template_field_option", {
  id: uuid("id").defaultRandom().primaryKey(),

  fieldId: uuid("field_id")
    .notNull()
    .references(() => templateField.id, { onDelete: "cascade" }),

  value: text("value").notNull(), // gymnastics, regional_level, ribbon
  label: text("label").notNull(), // Gymnastics, Regional Level, Ribbon
  sortOrder: integer("sort_order").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),

  // optional metadata for UI or behavior
  meta: jsonb("meta"),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/*
  Controls visibility / availability of child fields.
  Example:
  - show "division_class" if competition_level = school/division/regional/palaro
  - show "age_class" if competition_level = batang_pinoy/gap
*/
export const templateFieldCondition = pgTable("template_field_condition", {
  id: uuid("id").defaultRandom().primaryKey(),

  childFieldId: uuid("child_field_id")
    .notNull()
    .references(() => templateField.id, { onDelete: "cascade" }),

  parentFieldId: uuid("parent_field_id")
    .notNull()
    .references(() => templateField.id, { onDelete: "cascade" }),

  parentOptionId: uuid("parent_option_id")
    .notNull()
    .references(() => templateFieldOption.id, { onDelete: "cascade" }),

  conditionType: text("condition_type").notNull().default("show"),
  // show | enable | require

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/*
  Optional:
  Lets you define that the available options of one field
  depend on a selected option from another field.

  Example:
  - if discipline = rhythmic, apparatus options = ribbon, hoop, rope...
  - if discipline = aerobic, apparatus options = trio, mixed pair...
*/
export const templateOptionDependency = pgTable("template_option_dependency", {
  id: uuid("id").defaultRandom().primaryKey(),

  childFieldId: uuid("child_field_id")
    .notNull()
    .references(() => templateField.id, { onDelete: "cascade" }),

  childOptionId: uuid("child_option_id")
    .notNull()
    .references(() => templateFieldOption.id, { onDelete: "cascade" }),

  parentFieldId: uuid("parent_field_id")
    .notNull()
    .references(() => templateField.id, { onDelete: "cascade" }),

  parentOptionId: uuid("parent_option_id")
    .notNull()
    .references(() => templateFieldOption.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/*
   Event Instance
   Actual created event based on template
*/

export const event = pgTable("event", {
  id: uuid("id").defaultRandom().primaryKey(),

  templateId: uuid("template_id")
    .notNull()
    .references(() => eventTemplate.id, { onDelete: "restrict" }),

  createdByUserId: uuid("created_by_user_id").references(() => user.id, {
    onDelete: "restrict",
  }),

  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  // draft | live | finished

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/*
  Stores the actual selected values for each field.
*/
export const eventFieldValue = pgTable("event_field_value", {
  id: uuid("id").defaultRandom().primaryKey(),

  eventId: uuid("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),

  fieldId: uuid("field_id")
    .notNull()
    .references(() => templateField.id, { onDelete: "cascade" }),

  optionId: uuid("option_id").references(() => templateFieldOption.id, {
    onDelete: "set null",
  }),

  // use this when the field is text / number / custom input
  valueText: text("value_text"),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/*
  Optional helper table for "current active apparatus"
  without hardcoding apparatus as a dedicated master table.
*/
export const eventPhase = pgTable("event_phase", {
  id: uuid("id").defaultRandom().primaryKey(),

  eventId: uuid("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),

  phaseType: text("phase_type").notNull(), // apparatus_round | awarding | other
  label: text("label").notNull(), // Ribbon, Vault, Floor Exercise
  sequenceNo: integer("sequence_no").notNull().default(1),
  isActive: boolean("is_active").notNull().default(false),

  /*
    Optional link to a selected field option.
    Example:
    phaseType=apparatus_round, linked to the selected apparatus option
  */
  linkedFieldId: uuid("linked_field_id").references(() => templateField.id, {
    onDelete: "set null",
  }),
  linkedOptionId: uuid("linked_option_id").references(
    () => templateFieldOption.id,
    { onDelete: "set null" },
  ),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/*
   Judges
*/

export const judgeType = pgTable("judge_type", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // difficulty body | difficulty apparatus | artistry | execution | time judge | line judge
});

export const judge = pgTable("judge", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const eventJudgeAssignment = pgTable("event_judge_assignment", {
  id: uuid("id").defaultRandom().primaryKey(),

  eventId: uuid("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),

  judgeId: uuid("judge_id")
    .notNull()
    .references(() => judge.id, { onDelete: "cascade" }),

  judgeTypeId: integer("judge_type_id")
    .notNull()
    .references(() => judgeType.id, { onDelete: "restrict" }),

  judgeNumber: integer("judge_number").notNull().default(1),

  /*
    Optional phase binding if judges differ per apparatus/round
    Example: assign a judge specifically to Ribbon round
  */
  eventPhaseId: uuid("event_phase_id").references(() => eventPhase.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/* 
   Contestants / Entries
*/

export const contestant = pgTable("contestant", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  teamName: text("team_name"),
  gender: text("gender"),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const eventContestant = pgTable("event_contestant", {
  id: uuid("id").defaultRandom().primaryKey(),

  eventId: uuid("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),

  contestantId: uuid("contestant_id")
    .notNull()
    .references(() => contestant.id, { onDelete: "cascade" }),

  entryNo: integer("entry_no").notNull(),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/*
   Scoring
*/

export const scoreSheet = pgTable("score_sheet", {
  id: uuid("id").defaultRandom().primaryKey(),

  eventId: uuid("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),

  contestantId: uuid("contestant_id")
    .notNull()
    .references(() => contestant.id, { onDelete: "cascade" }),

  /*
    Instead of apparatusId, use phase
    so this works even if later the "scoring unit" is not an apparatus
  */
  eventPhaseId: uuid("event_phase_id").references(() => eventPhase.id, {
    onDelete: "set null",
  }),

  status: text("status").notNull().default("pending"),
  // pending | in_progress | completed

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const judgeScore = pgTable("judge_score", {
  id: uuid("id").defaultRandom().primaryKey(),

  scoreSheetId: uuid("score_sheet_id")
    .notNull()
    .references(() => scoreSheet.id, { onDelete: "cascade" }),

  judgeAssignmentId: uuid("judge_assignment_id")
    .notNull()
    .references(() => eventJudgeAssignment.id, { onDelete: "cascade" }),

  rawScore: real("raw_score").notNull(),
  isLocked: boolean("is_locked").notNull().default(false),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const penalty = pgTable("penalty", {
  id: uuid("id").defaultRandom().primaryKey(),

  scoreSheetId: uuid("score_sheet_id")
    .notNull()
    .references(() => scoreSheet.id, { onDelete: "cascade" }),

  judgeAssignmentId: uuid("judge_assignment_id").references(
    () => eventJudgeAssignment.id,
    { onDelete: "set null" },
  ),

  penaltyType: text("penalty_type").notNull(),
  // line | time | other

  value: real("value").notNull(),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const scoreSummary = pgTable("score_summary", {
  id: uuid("id").defaultRandom().primaryKey(),

  scoreSheetId: uuid("score_sheet_id")
    .notNull()
    .unique()
    .references(() => scoreSheet.id, { onDelete: "cascade" }),

  dbScore: real("db_score").notNull().default(0),
  daScore: real("da_score").notNull().default(0),
  dScore: real("d_score").notNull().default(0),

  aScore: real("a_score").notNull().default(0),
  eScore: real("e_score").notNull().default(0),

  totalScore: real("total_score").notNull().default(0),
  totalPenalty: real("total_penalty").notNull().default(0),
  finalScore: real("final_score").notNull().default(0),

  rank: integer("rank"),

  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/*
   Display / Ranking Settings
*/

export const rankingPresentationMode = pgTable("ranking_presentation_mode", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // live swapping | one by one transition
});

export const eventDisplaySettings = pgTable("event_display_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  eventId: uuid("event_id")
    .notNull()
    .unique()
    .references(() => event.id, { onDelete: "cascade" }),

  rankingModeId: integer("ranking_mode_id")
    .notNull()
    .references(() => rankingPresentationMode.id, { onDelete: "restrict" }),

  showLiveRankings: boolean("show_live_rankings").notNull().default(true),
  projectorTheme: text("projector_theme").default("default"),
  autoTransitionSeconds: integer("auto_transition_seconds").default(5),

  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/* 
   Relations
*/

export const eventTemplateRelations = relations(eventTemplate, ({ many }) => ({
  fields: many(templateField),
  events: many(event),
}));

export const templateFieldRelations = relations(
  templateField,
  ({ one, many }) => ({
    template: one(eventTemplate, {
      fields: [templateField.templateId],
      references: [eventTemplate.id],
    }),
    options: many(templateFieldOption),
    values: many(eventFieldValue),

    childConditions: many(templateFieldCondition, {
      relationName: "condition_child_field",
    }),
    parentConditions: many(templateFieldCondition, {
      relationName: "condition_parent_field",
    }),

    childOptionDependencies: many(templateOptionDependency, {
      relationName: "dependency_child_field",
    }),
    parentOptionDependencies: many(templateOptionDependency, {
      relationName: "dependency_parent_field",
    }),
  }),
);

export const templateFieldOptionRelations = relations(
  templateFieldOption,
  ({ one, many }) => ({
    field: one(templateField, {
      fields: [templateFieldOption.fieldId],
      references: [templateField.id],
    }),
    eventValues: many(eventFieldValue),

    parentConditions: many(templateFieldCondition),
    childDependencies: many(templateOptionDependency, {
      relationName: "dependency_child_option",
    }),
    parentDependencies: many(templateOptionDependency, {
      relationName: "dependency_parent_option",
    }),
  }),
);

export const templateFieldConditionRelations = relations(
  templateFieldCondition,
  ({ one }) => ({
    childField: one(templateField, {
      fields: [templateFieldCondition.childFieldId],
      references: [templateField.id],
      relationName: "condition_child_field",
    }),
    parentField: one(templateField, {
      fields: [templateFieldCondition.parentFieldId],
      references: [templateField.id],
      relationName: "condition_parent_field",
    }),
    parentOption: one(templateFieldOption, {
      fields: [templateFieldCondition.parentOptionId],
      references: [templateFieldOption.id],
    }),
  }),
);

export const templateOptionDependencyRelations = relations(
  templateOptionDependency,
  ({ one }) => ({
    childField: one(templateField, {
      fields: [templateOptionDependency.childFieldId],
      references: [templateField.id],
      relationName: "dependency_child_field",
    }),
    childOption: one(templateFieldOption, {
      fields: [templateOptionDependency.childOptionId],
      references: [templateFieldOption.id],
      relationName: "dependency_child_option",
    }),
    parentField: one(templateField, {
      fields: [templateOptionDependency.parentFieldId],
      references: [templateField.id],
      relationName: "dependency_parent_field",
    }),
    parentOption: one(templateFieldOption, {
      fields: [templateOptionDependency.parentOptionId],
      references: [templateFieldOption.id],
      relationName: "dependency_parent_option",
    }),
  }),
);

export const userRelations = relations(user, ({ many }) => ({
  events: many(event),
}));

export const eventRelations = relations(event, ({ one, many }) => ({
  template: one(eventTemplate, {
    fields: [event.templateId],
    references: [eventTemplate.id],
  }),
  creator: one(user, {
    fields: [event.createdByUserId],
    references: [user.id],
  }),
  fieldValues: many(eventFieldValue),
  phases: many(eventPhase),
  judgeAssignments: many(eventJudgeAssignment),
  contestants: many(eventContestant),
  scoreSheets: many(scoreSheet),
}));

export const eventFieldValueRelations = relations(
  eventFieldValue,
  ({ one }) => ({
    event: one(event, {
      fields: [eventFieldValue.eventId],
      references: [event.id],
    }),
    field: one(templateField, {
      fields: [eventFieldValue.fieldId],
      references: [templateField.id],
    }),
    option: one(templateFieldOption, {
      fields: [eventFieldValue.optionId],
      references: [templateFieldOption.id],
    }),
  }),
);

export const eventPhaseRelations = relations(eventPhase, ({ one, many }) => ({
  event: one(event, {
    fields: [eventPhase.eventId],
    references: [event.id],
  }),
  linkedField: one(templateField, {
    fields: [eventPhase.linkedFieldId],
    references: [templateField.id],
  }),
  linkedOption: one(templateFieldOption, {
    fields: [eventPhase.linkedOptionId],
    references: [templateFieldOption.id],
  }),
  judgeAssignments: many(eventJudgeAssignment),
  scoreSheets: many(scoreSheet),
}));

export const judgeRelations = relations(judge, ({ many }) => ({
  assignments: many(eventJudgeAssignment),
}));

export const judgeTypeRelations = relations(judgeType, ({ many }) => ({
  assignments: many(eventJudgeAssignment),
}));

export const eventJudgeAssignmentRelations = relations(
  eventJudgeAssignment,
  ({ one, many }) => ({
    event: one(event, {
      fields: [eventJudgeAssignment.eventId],
      references: [event.id],
    }),
    judge: one(judge, {
      fields: [eventJudgeAssignment.judgeId],
      references: [judge.id],
    }),
    judgeType: one(judgeType, {
      fields: [eventJudgeAssignment.judgeTypeId],
      references: [judgeType.id],
    }),
    eventPhase: one(eventPhase, {
      fields: [eventJudgeAssignment.eventPhaseId],
      references: [eventPhase.id],
    }),
    judgeScores: many(judgeScore),
  }),
);

export const contestantRelations = relations(contestant, ({ many }) => ({
  eventLinks: many(eventContestant),
  scoreSheets: many(scoreSheet),
}));

export const eventContestantRelations = relations(
  eventContestant,
  ({ one }) => ({
    event: one(event, {
      fields: [eventContestant.eventId],
      references: [event.id],
    }),
    contestant: one(contestant, {
      fields: [eventContestant.contestantId],
      references: [contestant.id],
    }),
  }),
);

export const scoreSheetRelations = relations(scoreSheet, ({ one, many }) => ({
  event: one(event, {
    fields: [scoreSheet.eventId],
    references: [event.id],
  }),
  contestant: one(contestant, {
    fields: [scoreSheet.contestantId],
    references: [contestant.id],
  }),
  eventPhase: one(eventPhase, {
    fields: [scoreSheet.eventPhaseId],
    references: [eventPhase.id],
  }),
  judgeScores: many(judgeScore),
  penalties: many(penalty),
  summary: one(scoreSummary, {
    fields: [scoreSheet.id],
    references: [scoreSummary.scoreSheetId],
  }),
}));

export const judgeScoreRelations = relations(judgeScore, ({ one }) => ({
  scoreSheet: one(scoreSheet, {
    fields: [judgeScore.scoreSheetId],
    references: [scoreSheet.id],
  }),
  judgeAssignment: one(eventJudgeAssignment, {
    fields: [judgeScore.judgeAssignmentId],
    references: [eventJudgeAssignment.id],
  }),
}));

export const penaltyRelations = relations(penalty, ({ one }) => ({
  scoreSheet: one(scoreSheet, {
    fields: [penalty.scoreSheetId],
    references: [scoreSheet.id],
  }),
  judgeAssignment: one(eventJudgeAssignment, {
    fields: [penalty.judgeAssignmentId],
    references: [eventJudgeAssignment.id],
  }),
}));

export const scoreSummaryRelations = relations(scoreSummary, ({ one }) => ({
  scoreSheet: one(scoreSheet, {
    fields: [scoreSummary.scoreSheetId],
    references: [scoreSheet.id],
  }),
}));

export const rankingPresentationModeRelations = relations(
  rankingPresentationMode,
  ({ many }) => ({
    displaySettings: many(eventDisplaySettings),
  }),
);

export const eventDisplaySettingsRelations = relations(
  eventDisplaySettings,
  ({ one }) => ({
    event: one(event, {
      fields: [eventDisplaySettings.eventId],
      references: [event.id],
    }),
    rankingMode: one(rankingPresentationMode, {
      fields: [eventDisplaySettings.rankingModeId],
      references: [rankingPresentationMode.id],
    }),
  }),
);
