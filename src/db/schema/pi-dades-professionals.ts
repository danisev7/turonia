import { pgTable, uuid, text, integer } from "drizzle-orm/pg-core";
import { piDocuments } from "./pi-documents";

export const piDadesProfessionals = pgTable("pi_dades_professionals", {
  id: uuid("id").defaultRandom().primaryKey(),
  piDocumentId: uuid("pi_document_id")
    .notNull()
    .references(() => piDocuments.id, { onDelete: "cascade" }),
  professional: text("professional").notNull(),
  nom: text("nom"),
  contacte: text("contacte"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
});
