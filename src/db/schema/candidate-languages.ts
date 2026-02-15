import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { candidates } from "./candidates";

export const candidateLanguages = pgTable(
  "candidate_languages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    level: text("level"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_candidate_language").on(table.candidateId, table.language),
  ]
);
