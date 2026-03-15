import {
  pgTable,
  uuid,
  text,
  boolean,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { clickeduStudents } from "./clickedu-students";
import { clickeduYears } from "./clickedu-years";

export const piDocuments = pgTable(
  "pi_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => clickeduStudents.id),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => clickeduYears.id),
    model: text("model"),
    prevUniversal: boolean("prev_universal").notNull().default(false),
    prevAddicional: boolean("prev_addicional").notNull().default(false),
    prevIntensiu: boolean("prev_intensiu").notNull().default(false),
    justNee: boolean("just_nee").notNull().default(false),
    justDea: boolean("just_dea").notNull().default(false),
    justTea: boolean("just_tea").notNull().default(false),
    justNouvingut: boolean("just_nouvingut").notNull().default(false),
    justAltesCap: boolean("just_altes_cap").notNull().default(false),
    justSocial: boolean("just_social").notNull().default(false),
    justAltres: boolean("just_altres").notNull().default(false),
    justText: text("just_text"),
    altresOrientacions: text("altres_orientacions"),
    horari: jsonb("horari"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_pi_document_student_year").on(
      table.studentId,
      table.schoolYearId
    ),
  ]
);
