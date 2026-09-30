import { pgTable, serial, text, integer, timestamp, varchar, boolean, index, jsonb, unique, uniqueIndex, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const constants = pgTable("constants", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	symbol: text().notNull(),
	value: text().notNull(),
	units: text().notNull(),
	description: text().notNull(),
	category: text(),
});

export const problems = pgTable("problems", {
	id: serial().primaryKey().notNull(),
	topic: text().notNull(),
	question: text().notNull(),
	difficulty: text().default('medium').notNull(),
	hint: text(),
	solution: text(),
	answer: text(),
});

export const glossary = pgTable("glossary", {
	id: serial().primaryKey().notNull(),
	term: text().notNull(),
	definition: text().notNull(),
	category: text(),
});

export const favorites = pgTable("favorites", {
	id: serial().primaryKey().notNull(),
	itemType: text("item_type").notNull(),
	itemId: integer("item_id").notNull(),
	itemName: text("item_name").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: varchar("user_id", { length: 255 }),
});

export const formulas = pgTable("formulas", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	category: text().notNull(),
	subcategory: text(),
	latex: text().notNull(),
	description: text().notNull(),
	variables: text().default(').notNull(),
	siUnits: text("si_units"),
	example: text(),
	relatedFormulas: text("related_formulas"),
	isFeatured: boolean("is_featured").default(false).notNull(),
	calculator: text(),
	relatedConstants: text("related_constants"),
	relatedGlossary: text("related_glossary"),
	derivation: text(),
	problems: text(),
});

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	role: varchar().default('user').notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const feedback = pgTable("feedback", {
	id: serial().primaryKey().notNull(),
	type: text().notNull(),
	message: text().notNull(),
	userId: varchar("user_id"),
	userName: text("user_name"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	feature: text(),
	ownerReply: text("owner_reply"),
	ownerRepliedAt: timestamp("owner_replied_at", { withTimezone: true, mode: 'string' }),
	userViewCount: integer("user_view_count").default(0).notNull(),
	userDismissed: boolean("user_dismissed").default(false).notNull(),
});

export const formulaViews = pgTable("formula_views", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	formulaId: integer("formula_id").notNull(),
	viewedAt: timestamp("viewed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("unique_user_formula").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.formulaId.asc().nullsLast().op("int4_ops")),
]);

export const adminActions = pgTable("admin_actions", {
	id: serial().primaryKey().notNull(),
	adminId: varchar("admin_id").notNull(),
	action: text().notNull(),
	targetUserId: varchar("target_user_id"),
	targetFormulaId: integer("target_formula_id"),
	details: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const announcementReads = pgTable("announcement_reads", {
	id: serial().primaryKey().notNull(),
	announcementId: integer("announcement_id").notNull(),
	userId: varchar("user_id").notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
	id: serial().primaryKey().notNull(),
	type: text().notNull(),
	scope: text().default('all').notNull(),
	title: text().notNull(),
	message: text().notNull(),
	icon: text(),
	priority: text().default('normal').notNull(),
	isPinned: boolean("is_pinned").default(false).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isDraft: boolean("is_draft").default(false).notNull(),
});

export const searchQueries = pgTable("search_queries", {
	id: serial().primaryKey().notNull(),
	query: text().notNull(),
	userId: varchar("user_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const userBans = pgTable("user_bans", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	reason: text().notNull(),
	bannedBy: varchar("banned_by").notNull(),
	bannedAt: timestamp("banned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	isPermanent: boolean("is_permanent").default(false).notNull(),
	unbannedAt: timestamp("unbanned_at", { withTimezone: true, mode: 'string' }),
	unbannedBy: varchar("unbanned_by"),
}, (table) => [
	unique("user_bans_user_id_unique").on(table.userId),
]);

export const userSessions = pgTable("user_sessions", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'string' }),
	country: text(),
	ip: text(),
});

export const achievementSettings = pgTable("achievement_settings", {
	key: varchar({ length: 64 }).primaryKey().notNull(),
	enabled: boolean().default(true).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const userAchievements = pgTable("user_achievements", {
	userId: varchar("user_id").notNull(),
	achievementKey: varchar("achievement_key", { length: 64 }).notNull(),
	progress: integer().default(0).notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.userId, table.achievementKey], name: "user_achievements_user_id_achievement_key_pk"}),
]);
