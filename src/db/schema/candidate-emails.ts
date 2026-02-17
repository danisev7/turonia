import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { candidates } from "./candidates";

export const candidateEmails = pgTable(
  "candidate_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    gmailMessageId: text("gmail_message_id").notNull(),
    gmailThreadId: text("gmail_thread_id"),
    direction: text("direction").notNull(),
    subject: text("subject"),
    bodyPreview: text("body_preview"),
    fromEmail: text("from_email"),
    toEmails: text("to_emails").array(),
    emailDate: timestamp("email_date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_candidate_emails_candidate_date").on(
      table.candidateId,
      table.emailDate
    ),
    index("idx_candidate_emails_gmail_message").on(table.gmailMessageId),
  ]
);
