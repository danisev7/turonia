import { pgTable, uuid, text, integer, boolean } from "drizzle-orm/pg-core";

export const piConfigTransversals = pgTable("pi_config_transversals", {
  id: uuid("id").defaultRandom().primaryKey(),
  stage: text("stage").notNull(), // "ESO" | "PRI"
  area: text("area").notNull(), // "Ciutadana", "Digital"...
  groupName: text("group_name").notNull(), // "1-2ESO", "3-4PRI"...
  especShort: text("espec_short").notNull(),
  especFull: text("espec_full").notNull(),
  critShort: text("crit_short"),
  critFull: text("crit_full"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});
