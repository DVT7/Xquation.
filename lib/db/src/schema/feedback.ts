import { pgTable, text, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "suggestion" | "complaint"
  message: text("message").notNull(),
  userId: varchar("user_id"),
  userName: text("user_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Feedback = typeof feedbackTable.$inferSelect;
export type InsertFeedback = typeof feedbackTable.$inferInsert;
