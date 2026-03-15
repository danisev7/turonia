import { pgTable, uuid, text, integer, jsonb } from "drizzle-orm/pg-core";
import { piDadesMateries } from "./pi-dades-materies";

export const piMateriaCurriculum = pgTable("pi_materia_curriculum", {
  id: uuid("id").defaultRandom().primaryKey(),
  piMateriaId: uuid("pi_materia_id")
    .notNull()
    .references(() => piDadesMateries.id, { onDelete: "cascade" }),
  nivell: text("nivell").notNull(),
  competencia: jsonb("competencia"), // string[] (CE codes)
  criteris: jsonb("criteris"), // [{code, short, full}]
  sabers: jsonb("sabers"), // [{code, short, full}]
  instruments: jsonb("instruments"), // ["instr1", "instr2"]
  avaluacio: text("avaluacio"),
  sortOrder: integer("sort_order").notNull().default(0),
});
