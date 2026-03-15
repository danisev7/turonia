import { pgTable, uuid, text, integer, boolean } from "drizzle-orm/pg-core";

export const piConfigMateries = pgTable("pi_config_materies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});
