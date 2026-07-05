import { pgTable, text, serial, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

// Tracks search queries for analytics
export const searchQueriesTable = pgTable("search_queries", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  userId: varchar("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SearchQuery = typeof searchQueriesTable.$inferSelect;

// Announcements: global + private
export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "global" | "private"
  scope: text("scope").notNull().default("all"), // "all" | "role_owner" | "role_user" | comma-separated userIds
  title: text("title").notNull(),
  message: text("message").notNull(),
  icon: text("icon"),
  priority: text("priority").notNull().default("normal"), // "low" | "normal" | "high" | "urgent"
  isPinned: boolean("is_pinned").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  isDraft: boolean("is_draft").notNull().default(false),
});

export type Announcement = typeof announcementsTable.$inferSelect;

// User reads for private announcements
export const announcementReadsTable = pgTable("announcement_reads", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").notNull(),
  userId: varchar("user_id").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
});

// User bans
export const userBansTable = pgTable("user_bans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  reason: text("reason").notNull(),
  bannedBy: varchar("banned_by").notNull(),
  bannedAt: timestamp("banned_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isPermanent: boolean("is_permanent").notNull().default(false),
  unbannedAt: timestamp("unbanned_at", { withTimezone: true }),
  unbannedBy: varchar("unbanned_by"),
});

export type UserBan = typeof userBansTable.$inferSelect;

// User activity sessions (for online status + session duration)
export const userSessionsTable = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  country: text("country"),
  ip: text("ip"),
});

export type UserSession = typeof userSessionsTable.$inferSelect;

// Admin action log
export const adminActionsTable = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").notNull(),
  action: text("action").notNull(), // "ban" | "unban" | "promote" | "demote" | "announce" | etc.
  targetUserId: varchar("target_user_id"),
  targetFormulaId: integer("target_formula_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminAction = typeof adminActionsTable.$inferSelect;
