import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { candidates } from "./candidates";
import { processedEmails } from "./processed-emails";

export const extractionLogs = pgTable("extraction_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  candidateId: uuid("candidate_id").references(() => candidates.id, {
    onDelete: "set null",
  }),
  emailId: uuid("email_id").references(() => processedEmails.id),
  modelUsed: text("model_used").notNull(),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  rawResponse: jsonb("raw_response"),
  confidenceScore: real("confidence_score"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
