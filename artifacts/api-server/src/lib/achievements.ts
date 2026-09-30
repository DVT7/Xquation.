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
export type AchievementUnlock = {
  key: AchievementKey;
  name: string;
  icon: string;
};

const FIRST_SITE_VETERAN_LIMIT = 100;

const TARGETS: Partial<Record<AchievementKey, number>> = {
  limbo_first: 1,
  limbo_100: 100,
  limbo_1000: 1000,
  formula_click: 1,
  read_aloud_1: 1,
  read_aloud_10: 10,
  read_aloud_100: 100,
  read_aloud_1000: 1000,
  meet_him: 1,
};

async function ensureAchievementSettings() {
  await db
    .insert(achievementSettingsTable)
    .values(ACHIEVEMENT_DEFINITIONS.map(({ key }) => ({ key, enabled: true })))
    .onConflictDoNothing();

  const [{ userCount }] = await db
    .select({ userCount: count() })
    .from(usersTable);
  if (Number(userCount ?? 0) > FIRST_SITE_VETERAN_LIMIT) {
    await db
      .update(achievementSettingsTable)
      .set({ enabled: false, updatedAt: new Date() })
      .where(eq(achievementSettingsTable.key, "veteran"));
  }
}

async function writeProgress(
  userId: string,
  key: AchievementKey,
  progress: number,
  preserveCompleted = true,
): Promise<boolean> {
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
  return !existing?.completedAt && !!completedAt;
}

function unlocksFor(keys: AchievementKey[]): AchievementUnlock[] {
  return keys.flatMap((key) => {
    const definition = ACHIEVEMENT_DEFINITIONS.find((candidate) => candidate.key === key);
    return definition ? [{ key: definition.key, name: definition.name, icon: definition.icon }] : [];
  });
}

async function currentProgress(userId: string, key: AchievementKey): Promise<number> {
  const [stored] = await db
    .select({ progress: userAchievementsTable.progress })
    .from(userAchievementsTable)
    .where(and(
      eq(userAchievementsTable.userId, userId),
      eq(userAchievementsTable.achievementKey, key),
    ));
  return stored?.progress ?? 0;
}

export async function recordAchievementEvent(
  userId: string,
  event: AchievementEvent,
  amount = 1,
): Promise<AchievementUnlock[]> {
  await ensureAchievementSettings();

  if (event === "limbo_passed") {
    const [limbo100, limbo1000] = await Promise.all([
      currentProgress(userId, "limbo_100"),
      currentProgress(userId, "limbo_1000"),
    ]);
    const results = await Promise.all([
      writeProgress(userId, "limbo_first", 1),
      writeProgress(userId, "limbo_100", limbo100 + 1),
      writeProgress(userId, "limbo_1000", limbo1000 + 1),
      writeProgress(userId, "meet_him", 1),
    ]);
    return unlocksFor(
      (["limbo_first", "limbo_100", "limbo_1000", "meet_him"] as AchievementKey[])
        .filter((_, index) => results[index]),
    );
  }

  if (event === "limbo_failed") {
    await Promise.all([
      writeProgress(userId, "limbo_100", 0),
      writeProgress(userId, "limbo_1000", 0),
    ]);
    return [];
  }

  if (event === "formula_click") {
    const completed = await writeProgress(userId, "formula_click", 1);
    return completed ? unlocksFor(["formula_click"]) : [];
  }

  const safeAmount = Math.max(1, Math.min(Math.floor(amount), 1_000_000));
  const readKeys: AchievementKey[] = [
    "read_aloud_1",
    "read_aloud_10",
    "read_aloud_100",
    "read_aloud_1000",
  ];
  const current = await currentProgress(userId, "read_aloud_1");
  const next = current + safeAmount;
  const results = await Promise.all(readKeys.map(async (key) => {
    const progress = key === "read_aloud_1" ? next : await currentProgress(userId, key) + safeAmount;
    return writeProgress(userId, key, progress);
  }));
  return unlocksFor(readKeys.filter((_, index) => results[index]));
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
    veteran: veteranUsers.some((user) => user.id === userId),
    passingThrone: currentUser?.role === "owner",
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
    if (key === "veteran") return derived.veteran ? 1 : (storedMap.get(key)?.progress ?? 0);
    if (key === "passing_throne") return derived.passingThrone ? 1 : (storedMap.get(key)?.progress ?? 0);
    return storedMap.get(key)?.progress ?? 0;
  };
  const isComplete = (key: AchievementKey) => {
    if (key === "formulas_complete") return derived.formulaTotal > 0 && derived.formulaViewed >= derived.formulaTotal;
    if (key === "veteran") return derived.veteran || !!storedMap.get(key)?.completedAt;
    if (key === "passing_throne") return derived.passingThrone || !!storedMap.get(key)?.completedAt;
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

export async function grantAchievement(userId: string, key: AchievementKey) {
  await ensureAchievementSettings();
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!user) return null;

  const target = TARGETS[key] ?? 1;
  await db
    .insert(userAchievementsTable)
    .values({
      userId,
      achievementKey: key,
      progress: target,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userAchievementsTable.userId, userAchievementsTable.achievementKey],
      set: { progress: target, completedAt: new Date(), updatedAt: new Date() },
    });
  return getUserAchievements(userId);
}