import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { clickeduYears } from "./clickedu-years";

export const clickeduStudents = pgTable(
  "clickedu_students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clickeduId: integer("clickedu_id").notNull(),
    schoolYearId: uuid("school_year_id")
      .notNull()
      .references(() => clickeduYears.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    classId: integer("class_id").notNull(),
    className: text("class_name").notNull(),
    idalu: text("idalu"),
    birthday: text("birthday"),
    gender: text("gender"),
    dni: text("dni"),
    email: text("email"),
    phone: text("phone"),
    secondaryPhone: text("secondary_phone"),
    mobilePhone: text("mobile_phone"),
    address: text("address"),
    postcode: text("postcode"),
    nationality: text("nationality"),
    countryOfBirth: text("country_of_birth"),
    placeOfBirth: text("place_of_birth"),
    parent1ClickeduId: integer("parent1_clickedu_id"),
    parent2ClickeduId: integer("parent2_clickedu_id"),
    remarks: text("remarks"),
    medicalRemarks: text("medical_remarks"),
    isRepetidor: boolean("is_repetidor").default(false).notNull(),
    isActive: boolean("is_active").default(true),
    listSyncedAt: timestamp("list_synced_at", { withTimezone: true }),
    detailSyncedAt: timestamp("detail_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("clickedu_students_clickedu_year_unique").on(
      table.clickeduId,
      table.schoolYearId
    ),
    index("idx_clickedu_students_school_year").on(table.schoolYearId),
  ]
);
