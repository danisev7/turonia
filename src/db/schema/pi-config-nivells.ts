import { pgTable, uuid, text, integer } from "drizzle-orm/pg-core";

export const piConfigNivellsAvaluacio = pgTable("pi_config_nivells_avaluacio", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});
