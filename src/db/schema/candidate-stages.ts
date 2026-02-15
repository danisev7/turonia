import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { candidates } from "./candidates";

export const candidateStages = pgTable(
  "candidate_stages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    stage: text("stage").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_candidate_stage").on(table.candidateId, table.stage),
    index("idx_candidate_stages_stage").on(table.stage),
  ]
);
