import { pgTable, text, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "suggestion" | "complaint"
  feature: text("feature"), // which tab/feature the complaint is about (null for suggestions)
  message: text("message").notNull(),
  userId: varchar("user_id"),
  userName: text("user_name"),
  ownerReply: text("owner_reply"),
  ownerRepliedAt: timestamp("owner_replied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Feedback = typeof feedbackTable.$inferSelect;
export type InsertFeedback = typeof feedbackTable.$inferInsert;
