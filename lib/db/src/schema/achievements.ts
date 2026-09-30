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
    key: "read_aloud_1",
    name: "Read Out One Word",
    description: "Read one word aloud.",
    icon: "volume-2",
  },
  {
    key: "read_aloud_10",
    name: "Read Out Ten Words",
    description: "Read ten words aloud.",
    icon: "volume-2",
  },
  {
    key: "read_aloud_100",
    name: "Read Out One Hundred Words",
    description: "Read one hundred words aloud.",
    icon: "volume-2",
  },
  {
    key: "read_aloud_1000",
    name: "Read Out One Thousand Words",
    description: "Read one thousand words aloud.",
    icon: "volume-2",
  },
  {
    key: "veteran",
    name: "Veteran",
    description: "Be one of the first 100 accounts to join XQuation.",
    icon: "users",
  },
  {
    key: "passing_throne",
    name: "Passing of the Throne",
    description: "Get promoted to owner rank.",
    icon: "crown",
  },
  {
    key: "meet_him",
    name: "Get to Know Him",
    description: "",
    icon: "user-round",
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