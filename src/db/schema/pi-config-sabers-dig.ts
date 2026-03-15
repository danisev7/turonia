import { pgTable, uuid, text, integer, boolean } from "drizzle-orm/pg-core";

export const piConfigSabersDig = pgTable("pi_config_sabers_dig", {
  id: uuid("id").defaultRandom().primaryKey(),
  stage: text("stage").notNull(), // "ESO" | "PRI"
  groupName: text("group_name"), // "1-2PRI"... (for PRI only)
  fullText: text("full_text").notNull(),
  shortText: text("short_text").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});
