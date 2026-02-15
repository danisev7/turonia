import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  authId: uuid("auth_id").notNull().unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
