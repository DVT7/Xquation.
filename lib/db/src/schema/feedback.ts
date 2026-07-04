import { pgTable, text, serial, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "suggestion" | "complaint"
  feature: text("feature"), // which tab/feature the complaint is about (null for suggestions)
  message: text("message").notNull(),
  userId: varchar("user_id"),
  userName: text("user_name"),
  ownerReply: text("owner_reply"),
  ownerRepliedAt: timestamp("owner_replied_at", { withTimezone: true }),
  // Tracks how many times the user has viewed the owner's reply without counter-replying.
  // After 5 visits it is auto-dismissed from the user's view.
  userViewCount: integer("user_view_count").notNull().default(0),
  userDismissed: boolean("user_dismissed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Feedback = typeof feedbackTable.$inferSelect;
export type InsertFeedback = typeof feedbackTable.$inferInsert;
