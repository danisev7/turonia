import { pgTable, uuid, text, integer, unique } from "drizzle-orm/pg-core";
import { piDocuments } from "./pi-documents";

export const piDadesMateries = pgTable(
  "pi_dades_materies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    piDocumentId: uuid("pi_document_id")
      .notNull()
      .references(() => piDocuments.id, { onDelete: "cascade" }),
    materia: text("materia").notNull(),
    docent: text("docent"),
    nivell: text("nivell"),
    observacions: text("observacions"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    unique("uq_pi_dades_materia").on(table.piDocumentId, table.materia),
  ]
);
