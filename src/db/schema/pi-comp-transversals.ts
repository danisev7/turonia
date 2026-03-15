import { pgTable, uuid, text, integer, jsonb } from "drizzle-orm/pg-core";
import { piDocuments } from "./pi-documents";

export const piCompTransversals = pgTable("pi_comp_transversals", {
  id: uuid("id").defaultRandom().primaryKey(),
  piDocumentId: uuid("pi_document_id")
    .notNull()
    .references(() => piDocuments.id, { onDelete: "cascade" }),
  nivell: text("nivell").notNull(),
  area: jsonb("area").notNull(), // string[]
  especifica: jsonb("especifica"), // string[]
  criteris: jsonb("criteris"), // [{short, full}]
  sabers: jsonb("sabers"), // [{short, full}] (only Digital)
  avaluacio: text("avaluacio"),
  sortOrder: integer("sort_order").notNull().default(0),
});
