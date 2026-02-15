import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const gmailConfig = pgTable("gmail_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailAccount: text("email_account").notNull(),
  credentialsEnvVar: text("credentials_env_var").notNull(),
  lastHistoryId: text("last_history_id"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
