import { pgTable, uuid, text, integer, unique } from "drizzle-orm/pg-core";
import { piDocuments } from "./pi-documents";

export const piOrientacions = pgTable(
  "pi_orientacions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    piDocumentId: uuid("pi_document_id")
      .notNull()
      .references(() => piDocuments.id, { onDelete: "cascade" }),
    tipus: text("tipus").notNull(),
    mesura: text("mesura").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    unique("uq_pi_orientacio").on(
      table.piDocumentId,
      table.tipus,
      table.mesura
    ),
  ]
);
