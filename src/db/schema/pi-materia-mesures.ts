import { pgTable, uuid, text, integer, jsonb } from "drizzle-orm/pg-core";
import { piDadesMateries } from "./pi-dades-materies";

export const piMateriaMesures = pgTable("pi_materia_mesures", {
  id: uuid("id").defaultRandom().primaryKey(),
  piMateriaId: uuid("pi_materia_id")
    .notNull()
    .references(() => piDadesMateries.id, { onDelete: "cascade" }),
  tipus: text("tipus").notNull(),
  mesures: jsonb("mesures").notNull(), // ["mesura1", "mesura2"]
  observacions: text("observacions"),
  sortOrder: integer("sort_order").notNull().default(0),
});
