import { boolean, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const limboProgressTable = pgTable("limbo_progress", {
  userId: varchar("user_id").primaryKey(),
  wrongColors: jsonb("wrong_colors").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  centerActivated: boolean("center_activated").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LimboProgress = typeof limboProgressTable.$inferSelect;