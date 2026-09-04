import {
  ACHIEVEMENT_DEFINITIONS,
  achievementSettingsTable,
  db,
  formulasTable,
  formulaViewsTable,
  usersTable,
  userAchievementsTable,
  type AchievementKey,
} from "@workspace/db";
import { and, asc, count, eq, inArray } from "drizzle-orm";

export type AchievementEvent = "limbo_passed" | "limbo_failed" | "formula_click" | "read_aloud";

const FIRST_SITE_VETERAN_LIMIT = 10;

const TARGETS: Partial<Record<AchievementKey, number>> = {
  limbo_first: 1,
  limbo_100: 100,
  limbo_1000: 1000,
  formula_click: 1,
  read_aloud: 1,
};

async function ensureAchievementSettings() {
  await db
    .insert(achievementSettingsTable)
    .values(ACHIEVEMENT_DEFINITIONS.map(({ key }) => ({ key, enabled: true })))
    .onConflictDoNothing();
}

async function writeProgress(
  userId: string,
  key: AchievementKey,
  progress: number,
  preserveCompleted = true,
) {
  const [existing] = await db
    .select({ completedAt: userAchievementsTable.completedAt })
    .from(userAchievementsTable)
    .where(and(
      eq(userAchievementsTable.userId, userId),
      eq(userAchievementsTable.achievementKey, key),
    ));
  const target = TARGETS[key];
  const completedAt = preserveCompleted && existing?.completedAt
    ? existing.completedAt
    : target && progress >= target
      ? new Date()
      : null;

  await db
    .insert(userAchievementsTable)
    .values({
      userId,
      achievementKey: key,
      progress,
      completedAt,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userAchievementsTable.userId, userAchievementsTable.achievementKey],
      set: { progress, completedAt, updatedAt: new Date() },
    });
}

export async function recordAchievementEvent(userId: string, event: AchievementEvent) {
  await ensureAchievementSettings();

  if (event === "limbo_passed") {
    const [limbo100] = await db
      .select({ progress: userAchievementsTable.progress })
      .from(userAchievementsTable)
      .where(and(
        eq(userAchievementsTable.userId, userId),
        eq(userAchievementsTable.achievementKey, "limbo_100"),
      ));
    const [limbo1000] = await db
      .select({ progress: userAchievementsTable.progress })
      .from(userAchievementsTable)
      .where(and(
        eq(userAchievementsTable.userId, userId),
        eq(userAchievementsTable.achievementKey, "limbo_1000"),
      ));

    await Promise.all([
      writeProgress(userId, "limbo_first", 1),
      writeProgress(userId, "limbo_100", (limbo100?.progress ?? 0) + 1),
      writeProgress(userId, "limbo_1000", (limbo1000?.progress ?? 0) + 1),
    ]);
    return;
  }

  if (event === "limbo_failed") {
    await Promise.all([
      writeProgress(userId, "limbo_100", 0),
      writeProgress(userId, "limbo_1000", 0),
    ]);
    return;
  }

  if (event === "formula_click") {
    await writeProgress(userId, "formula_click", 1);
    return;
  }

  await writeProgress(userId, "read_aloud", 1);
}

async function getDerivedProgress(userId: string) {
  const [[formulaTotal], [formulaViewed], [currentUser], veteranUsers] = await Promise.all([
    db.select({ count: count() }).from(formulasTable),
    db.select({ count: count() }).from(formulaViewsTable).where(eq(formulaViewsTable.userId, userId)),
    db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)),
    db.select({ id: usersTable.id }).from(usersTable).orderBy(asc(usersTable.createdAt)).limit(FIRST_SITE_VETERAN_LIMIT),
  ]);

  return {
    formulaTotal: Number(formulaTotal?.count ?? 0),
    formulaViewed: Number(formulaViewed?.count ?? 0),
    lonelyKing: currentUser?.role === "owner" && veteranUsers.some((user) => user.id === userId),
  };
}

export async function getUserAchievements(userId: string) {
  await ensureAchievementSettings();
  const [settings, stored, derived] = await Promise.all([
    db.select().from(achievementSettingsTable),
    db.select().from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId)),
    getDerivedProgress(userId),
  ]);

  const settingMap = new Map(settings.map((setting) => [setting.key, setting.enabled]));
  const storedMap = new Map(stored.map((achievement) => [achievement.achievementKey, achievement]));
  const progressFor = (key: AchievementKey) => {
    if (key === "formulas_complete") return derived.formulaViewed;
    if (key === "lonely_king") return derived.lonelyKing ? 1 : 0;
    return storedMap.get(key)?.progress ?? 0;
  };
  const isComplete = (key: AchievementKey) => {
    if (key === "formulas_complete") return derived.formulaTotal > 0 && derived.formulaViewed >= derived.formulaTotal;
    if (key === "lonely_king") return derived.lonelyKing;
    const saved = storedMap.get(key);
    return !!saved?.completedAt;
  };

  const enabledDefinitions = ACHIEVEMENT_DEFINITIONS.filter((definition) => settingMap.get(definition.key) !== false);
  const baseDefinitions = enabledDefinitions.filter((definition) => definition.key !== "maximizer");
  const maximizerComplete = baseDefinitions.every((definition) => isComplete(definition.key));

  return enabledDefinitions.map((definition) => ({
    key: definition.key,
    name: definition.name,
    description: definition.description,
    icon: definition.icon,
    enabled: true,
    progress: definition.key === "maximizer" ? (maximizerComplete ? 1 : 0) : progressFor(definition.key),
    target: definition.key === "formulas_complete" ? derived.formulaTotal : TARGETS[definition.key],
    completed: definition.key === "maximizer" ? maximizerComplete : isComplete(definition.key),
    completedAt: storedMap.get(definition.key)?.completedAt?.toISOString() ?? null,
  }));
}

export async function getOwnerAchievementSettings() {
  await ensureAchievementSettings();
  const settings = await db.select().from(achievementSettingsTable);
  const storedCounts = await db
    .select({
      key: userAchievementsTable.achievementKey,
      count: count(),
    })
    .from(userAchievementsTable)
    .where(inArray(userAchievementsTable.achievementKey, ACHIEVEMENT_DEFINITIONS.map(({ key }) => key)))
    .groupBy(userAchievementsTable.achievementKey);
  const settingMap = new Map(settings.map((setting) => [setting.key, setting.enabled]));
  const countMap = new Map(storedCounts.map((item) => [item.key, Number(item.count)]));

  return ACHIEVEMENT_DEFINITIONS.map((definition) => ({
    ...definition,
    enabled: settingMap.get(definition.key) !== false,
    unlockedCount: countMap.get(definition.key) ?? 0,
  }));
}

export async function setAchievementEnabled(key: AchievementKey, enabled: boolean) {
  await ensureAchievementSettings();
  await db
    .update(achievementSettingsTable)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(achievementSettingsTable.key, key));
  return (await getOwnerAchievementSettings()).find((achievement) => achievement.key === key);
}