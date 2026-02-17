import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const jobOffers = pgTable("job_offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  gmailMessageId: text("gmail_message_id").notNull().unique(),
  subject: text("subject"),
  bodyPreview: text("body_preview"),
  sentDate: timestamp("sent_date", { withTimezone: true }).notNull(),
  bccRecipients: text("bcc_recipients").array(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
