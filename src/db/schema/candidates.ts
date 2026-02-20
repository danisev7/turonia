import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    phone: text("phone"),
    dateOfBirth: date("date_of_birth"),
    dateOfBirthApproximate: boolean("date_of_birth_approximate")
      .notNull()
      .default(false),
    educationLevel: text("education_level"),
    workExperienceSummary: text("work_experience_summary"),
    teachingMonths: integer("teaching_months"),
    status: text("status").notNull().default("pendent"),
    evaluation: text("evaluation"),
    specialty: text("specialty"),
    observations: text("observations"),
    receptionDate: timestamp("reception_date", { withTimezone: true }).notNull(),
    lastContactDate: timestamp("last_contact_date", { withTimezone: true }),
    lastResponseDate: timestamp("last_response_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_candidates_status").on(table.status),
    index("idx_candidates_evaluation").on(table.evaluation),
    index("idx_candidates_reception_date").on(table.receptionDate),
    index("idx_candidates_email").on(table.email),
  ]
);
