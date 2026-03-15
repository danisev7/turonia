import { pgTable, uuid, text, integer, boolean, unique } from "drizzle-orm/pg-core";

export const piConfigModelMesures = pgTable(
  "pi_config_model_mesures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    model: text("model").notNull(),
    tipus: text("tipus").notNull(),
    mesura: text("mesura").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    unique("uq_pi_model_mesura").on(table.model, table.tipus, table.mesura),
  ]
);
