import {
  pgTable,
  uuid,
  text,
  boolean,
  date,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { clickeduStudents } from "./clickedu-students";
import { clickeduYears } from "./clickedu-years";

export const studentNeseData = pgTable(
  "student_nese_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => clickeduStudents.id),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => clickeduYears.id),
    dataIncorporacio: date("data_incorporacio"),
    escolaritzacioPrevia: text("escolaritzacio_previa"),
    reunioPoe: boolean("reunio_poe").notNull().default(false),
    reunioMesi: boolean("reunio_mesi"),
    reunioEap: boolean("reunio_eap").notNull().default(false),
    informeEap: text("informe_eap"),
    cad: text("cad"), // legacy — kept for backward compat
    cadPercentatge: text("cad_percentatge"),
    cadDataVenciment: text("cad_data_venciment"),
    informeDiagnostic: text("informe_diagnostic"),
    cursRetencio: text("curs_retencio"),
    nise: text("nise"),
    ssd: boolean("ssd").notNull().default(false),
    mesuraNese: text("mesura_nese"),
    materiesPi: text("materies_pi"),
    eixosPi: text("eixos_pi"),
    nacPi: text("nac_pi"),
    nacFinal: text("nac_final"),
    serveisExterns: text("serveis_externs"),
    becaMec: text("beca_mec"),
    observacionsCurs: text("observacions_curs"),
    dadesRellevantsHistoric: text("dades_rellevants_historic"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_student_nese_year").on(table.studentId, table.schoolYearId),
  ]
);
