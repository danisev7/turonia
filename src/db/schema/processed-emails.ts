import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const processedEmails = pgTable(
  "processed_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gmailMessageId: text("gmail_message_id").notNull().unique(),
    gmailThreadId: text("gmail_thread_id"),
    classification: text("classification"),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processingStatus: text("processing_status").notNull().default("completed"),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("idx_processed_emails_gmail_message").on(table.gmailMessageId),
  ]
);
