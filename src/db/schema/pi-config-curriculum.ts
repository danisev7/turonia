import { pgTable, uuid, text, integer, boolean, unique } from "drizzle-orm/pg-core";

export const piConfigCurriculum = pgTable(
  "pi_config_curriculum",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stage: text("stage").notNull(), // "ESO" | "PRI"
    subject: text("subject").notNull(),
    level: text("level").notNull(), // "1ESO", "6PRI"...
    entryType: text("entry_type").notNull(), // "COMP_ESPEC" | "CRIT" | "SABER"
    code: text("code").notNull(),
    fullText: text("full_text").notNull(),
    shortText: text("short_text"),
    parentCode: text("parent_code"), // For CRIT: links to COMP_ESPEC code
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    unique("uq_pi_curriculum").on(
      table.stage,
      table.subject,
      table.level,
      table.entryType,
      table.code
    ),
  ]
);
