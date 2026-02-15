import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const aiModelConfig = pgTable("ai_model_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskType: text("task_type").notNull().unique(),
  provider: text("provider").notNull(),
  modelId: text("model_id").notNull(),
  apiKeyEnvVar: text("api_key_env_var").notNull(),
  maxTokens: integer("max_tokens"),
  temperature: real("temperature"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
