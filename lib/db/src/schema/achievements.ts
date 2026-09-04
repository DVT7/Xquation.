import { boolean, integer, pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

export const ACHIEVEMENT_DEFINITIONS = [
  {
    key: "limbo_first",
    name: "Passing Limbo Once",
    description: "Pass the Limbo challenge for the first time.",
    icon: "trophy",
  },
  {
    key: "limbo_100",
    name: "Passing Limbo 100 in a Row",
    description: "Pass Limbo 100 consecutive times.",
    icon: "flame",
  },
  {
    key: "limbo_1000",
    name: "Passing Limbo 1,000 in a Row",
    description: "Pass Limbo 1,000 consecutive times.",
    icon: "flame",
  },
  {
    key: "formula_click",
    name: "Clicking Once in an Xquation",
    description: "Interact with a formula page once.",
    icon: "mouse-pointer-click",
  },
  {
    key: "read_aloud",
    name: "Reading Aloud One Xquation",
    description: "Use Read Aloud on one xquation.",
    icon: "volume-2",
  },
  {
    key: "formulas_complete",
    name: "Visiting Every Single Formula",
    description: "Spend enough time with every formula in Xquation.",
    icon: "library",
  },
  {
    key: "maximizer",
    name: "The Maximizer",
    description: "Complete every enabled achievement available in Xquation.",
    icon: "sparkles",
  },
  {
    key: "lonely_king",
    name: "The Lonely King",
    description: "Become an owner while being one of Xquation's first site veterans.",
    icon: "crown",
  },
] as const;

export type AchievementKey = (typeof ACHIEVEMENT_DEFINITIONS)[number]["key"];

export const achievementSettingsTable = pgTable("achievement_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userAchievementsTable = pgTable(
  "user_achievements",
  {
    userId: varchar("user_id").notNull(),
    achievementKey: varchar("achievement_key", { length: 64 }).notNull(),
    progress: integer("progress").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.achievementKey] })],
);

export type AchievementSetting = typeof achievementSettingsTable.$inferSelect;
export type UserAchievement = typeof userAchievementsTable.$inferSelect;