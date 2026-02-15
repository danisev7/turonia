import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { jobOffers } from "./job-offers";
import { candidates } from "./candidates";

export const jobOfferCandidates = pgTable(
  "job_offer_candidates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobOfferId: uuid("job_offer_id")
      .notNull()
      .references(() => jobOffers.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    interested: text("interested"),
    responseDate: timestamp("response_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_job_offer_candidate").on(table.jobOfferId, table.candidateId),
  ]
);
