import { pgTable, uuid, text, integer, boolean, unique } from "drizzle-orm/pg-core";
import { clickeduYears } from "./clickedu-years";

export const piConfigDocents = pgTable(
  "pi_config_docents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    clickeduId: integer("clickedu_id"),
    firstName: text("first_name"),
    lastName1: text("last_name1"),
    lastName2: text("last_name2"),
    email: text("email"),
    phone: text("phone"),
    dni: text("dni"),
    birthday: text("birthday"),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => clickeduYears.id),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    unique("uq_pi_docent_year").on(table.name, table.schoolYearId),
    unique("uq_pi_docent_clickedu_year").on(
      table.clickeduId,
      table.schoolYearId
    ),
  ]
);
