import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { candidates } from "./candidates";

export const candidateDocuments = pgTable("candidate_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  storagePath: text("storage_path").notNull(),
  isLatest: boolean("is_latest").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
