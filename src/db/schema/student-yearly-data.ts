import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { clickeduStudents } from "./clickedu-students";
import { clickeduYears } from "./clickedu-years";

export const studentYearlyData = pgTable(
  "student_yearly_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => clickeduStudents.id),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => clickeduYears.id),
    graellaNese: boolean("graella_nese").notNull().default(false),
    cursRepeticio: text("curs_repeticio"),
    dadesFamiliars: text("dades_familiars"),
    academic: text("academic"),
    comportament: text("comportament"),
    acordsTutoria: text("acords_tutoria"),
    estat: text("estat"),
    observacions: text("observacions"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_student_year").on(table.studentId, table.schoolYearId),
    index("idx_student_yearly_school_year").on(table.schoolYearId),
    index("idx_student_yearly_estat").on(table.estat),
  ]
);
