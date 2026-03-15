import { pgTable, uuid, text, integer, date } from "drizzle-orm/pg-core";
import { piDocuments } from "./pi-documents";

export const piSeguimentSignatures = pgTable("pi_seguiment_signatures", {
  id: uuid("id").defaultRandom().primaryKey(),
  piDocumentId: uuid("pi_document_id")
    .notNull()
    .references(() => piDocuments.id, { onDelete: "cascade" }),
  rol: text("rol").notNull(),
  nom: text("nom"),
  dataSignatura: date("data_signatura"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const piSeguimentReunions = pgTable("pi_seguiment_reunions", {
  id: uuid("id").defaultRandom().primaryKey(),
  piDocumentId: uuid("pi_document_id")
    .notNull()
    .references(() => piDocuments.id, { onDelete: "cascade" }),
  dataReunio: date("data_reunio"),
  assistents: text("assistents"),
  acords: text("acords"),
  properPas: text("proper_pas"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const piSeguimentContinuitat = pgTable("pi_seguiment_continuitat", {
  id: uuid("id").defaultRandom().primaryKey(),
  piDocumentId: uuid("pi_document_id")
    .notNull()
    .references(() => piDocuments.id, { onDelete: "cascade" }),
  dataDecisio: date("data_decisio"),
  decisio: text("decisio"),
  motiu: text("motiu"),
  responsable: text("responsable"),
  sortOrder: integer("sort_order").notNull().default(0),
});
