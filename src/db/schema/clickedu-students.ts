import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const clickeduStudents = pgTable("clickedu_students", {
  id: uuid("id").defaultRandom().primaryKey(),
  clickeduId: integer("clickedu_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  classId: integer("class_id").notNull(),
  className: text("class_name").notNull(),
  isRepetidor: boolean("is_repetidor").default(false).notNull(),
  isActive: boolean("is_active").default(true),
  listSyncedAt: timestamp("list_synced_at", { withTimezone: true }),
  detailSyncedAt: timestamp("detail_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
