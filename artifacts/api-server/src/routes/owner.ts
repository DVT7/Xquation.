import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  usersTable,
  favoritesTable,
  formulaViewsTable,
  formulasTable,
  searchQueriesTable,
  announcementsTable,
  userBansTable,
  userSessionsTable,
  adminActionsTable,
  feedbackTable,
  insertFormulaSchema,
} from "@workspace/db";
import {
  eq, sql, desc, count, gte, isNull, and, or, gt,
} from "drizzle-orm";

const router: IRouter = Router();

// ── POST /api/owner/formulas ─────────────────────────────────────────────────────
router.post("/owner/formulas", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = insertFormulaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a name, category, LaTeX formula, and description." });
    return;
  }

  const data = parsed.data;
  if (data.calculator) {
    if (data.calculator.length > 50_000) {
      res.status(400).json({ error: "Calculator definition is too large." });
      return;
    }
    try {
      const calculator = JSON.parse(data.calculator) as Record<string, unknown>;
      if (
        !calculator ||
        typeof calculator !== "object" ||
        typeof calculator.expression !== "string" ||
        !Array.isArray(calculator.inputs)
      ) {
        res.status(400).json({ error: "Calculator definition is invalid." });
        return;
      }
    } catch {
      res.status(400).json({ error: "Calculator definition must be valid JSON." });
      return;
    }
  }

  const [formula] = await db.insert(formulasTable).values(data).returning();

  await db.insert(adminActionsTable).values({
    adminId: req.user!.id,
    action: "create_formula",
    details: { formulaId: formula.id, formulaName: formula.name },
  });

  res.status(201).json(formula);
});

// ── GET /api/owner/analytics ────────────────────────────────────────────────────
router.get("/owner/analytics", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    newUsersToday,
    totalViews,
    totalFavorites,
    totalSearches,
    activeSessionsToday,
    onlineUsers,
  ] = await Promise.all([
    db.select({ cnt: count() }).from(usersTable),
    db.select({ cnt: count() }).from(usersTable).where(gte(usersTable.createdAt, today)),
    db.select({ cnt: count() }).from(formulaViewsTable),
    db.select({ cnt: count() }).from(favoritesTable),
    db.select({ cnt: count() }).from(searchQueriesTable),
    db.select({ cnt: count() }).from(userSessionsTable).where(gte(userSessionsTable.startedAt, today)),
    db.select({ cnt: count() }).from(userSessionsTable).where(isNull(userSessionsTable.endedAt)),
  ]);

  // Top 5 most viewed formulas
  const topViewed = await db
    .select({
      formulaId: formulaViewsTable.formulaId,
      formulaName: formulasTable.name,
      views: sql<number>`count(*)::int`,
    })
    .from(formulaViewsTable)
    .innerJoin(formulasTable, eq(formulaViewsTable.formulaId, formulasTable.id))
    .groupBy(formulaViewsTable.formulaId, formulasTable.name)
    .orderBy(sql`count(*) desc`)
    .limit(5);

  // Top 5 most favorited items
  const topFavorited = await db
    .select({
      itemId: favoritesTable.itemId,
      itemName: sql<string>`max(${favoritesTable.itemName})`,
      favorites: sql<number>`count(*)::int`,
    })
    .from(favoritesTable)
    .groupBy(favoritesTable.itemId)
    .orderBy(sql`count(*) desc`)
    .limit(5);

  // Most searched terms
  const topSearches = await db
    .select({
      query: searchQueriesTable.query,
      count: sql<number>`count(*)::int`,
    })
    .from(searchQueriesTable)
    .groupBy(searchQueriesTable.query)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  // Feedback counts
  const feedbackCounts = await db
    .select({
      total: count(),
      open: sql<number>`count(*) filter (where owner_reply is null)::int`,
      replied: sql<number>`count(*) filter (where owner_reply is not null)::int`,
    })
    .from(feedbackTable);

  res.json({
    totalUsers: Number(totalUsers[0]?.cnt ?? 0),
    newUsersToday: Number(newUsersToday[0]?.cnt ?? 0),
    totalViews: Number(totalViews[0]?.cnt ?? 0),
    totalFavorites: Number(totalFavorites[0]?.cnt ?? 0),
    totalSearches: Number(totalSearches[0]?.cnt ?? 0),
    activeSessionsToday: Number(activeSessionsToday[0]?.cnt ?? 0),
    onlineUsers: Number(onlineUsers[0]?.cnt ?? 0),
    topViewed,
    topFavorited,
    topSearches,
    feedback: feedbackCounts[0] ?? { total: 0, open: 0, replied: 0 },
  });
});

// ── GET /api/owner/users ──────────────────────────────────────────────────────────
router.get("/owner/users", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const search = (req.query.search as string)?.toLowerCase().trim() ?? "";
  const role = (req.query.role as string) ?? "";

  const allUsers = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  let filtered = allUsers;
  if (search) {
    filtered = allUsers.filter(
      (u) =>
        u.email?.toLowerCase().includes(search) ||
        u.firstName?.toLowerCase().includes(search) ||
        u.lastName?.toLowerCase().includes(search)
    );
  }
  if (role) {
    filtered = filtered.filter((u) => u.role === role);
  }

  // Enrich with counts
  const enriched = await Promise.all(
    filtered.map(async (u) => {
      const [favRow] = await db
        .select({ cnt: count() })
        .from(favoritesTable)
        .where(eq(favoritesTable.userId, u.id));
      const [viewRow] = await db
        .select({ cnt: count() })
        .from(formulaViewsTable)
        .where(eq(formulaViewsTable.userId, u.id));
      const [ban] = await db
        .select()
        .from(userBansTable)
        .where(eq(userBansTable.userId, u.id))
        .limit(1);
      const [lastSession] = await db
        .select()
        .from(userSessionsTable)
        .where(eq(userSessionsTable.userId, u.id))
        .orderBy(desc(userSessionsTable.startedAt))
        .limit(1);

      const isBanned = !!ban && !ban.unbannedAt && (ban.isPermanent || !ban.expiresAt || ban.expiresAt > new Date());

      return {
        ...u,
        favoritesCount: Number(favRow?.cnt ?? 0),
        formulasViewed: Number(viewRow?.cnt ?? 0),
        isBanned,
        banReason: isBanned ? ban.reason : undefined,
        banExpiresAt: isBanned ? ban.expiresAt : undefined,
        isOnline: !lastSession?.endedAt,
        lastActive: lastSession?.startedAt,
      };
    })
  );

  res.json({ users: enriched });
});

// ── PATCH /api/owner/users/:id/role ──────────────────────────────────
router.patch("/owner/users/:id/role", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const userId = String(req.params.id);
  const { role } = req.body;
  if (!role || !["user", "owner"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  if (userId === req.user!.id) {
    res.status(400).json({ error: "Cannot change your own role" });
    return;
  }

  await db.update(usersTable).set({ role }).where(eq(usersTable.id, userId));
  await db.insert(adminActionsTable).values({
    adminId: req.user!.id,
    action: role === "owner" ? "promote" : "demote",
    targetUserId: userId,
    details: { newRole: role },
  });

  res.json({ success: true });
});

// ── POST /api/owner/users/:id/ban ─────────────────────────────────────
router.post("/owner/users/:id/ban", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const userId = String(req.params.id);
  const { reason, durationMinutes, isPermanent } = req.body;
  if (!reason) {
    res.status(400).json({ error: "Ban reason required" });
    return;
  }
  if (userId === req.user!.id) {
    res.status(400).json({ error: "Cannot ban yourself" });
    return;
  }

  const expiresAt =
    isPermanent || !durationMinutes
      ? null
      : new Date(Date.now() + durationMinutes * 60 * 1000);

  await db
    .insert(userBansTable)
    .values({
      userId,
      reason,
      bannedBy: req.user!.id,
      expiresAt,
      isPermanent: !!isPermanent,
    })
    .onConflictDoUpdate({
      target: userBansTable.userId,
      set: {
        reason,
        bannedBy: req.user!.id,
        bannedAt: new Date(),
        expiresAt,
        isPermanent: !!isPermanent,
        unbannedAt: null,
        unbannedBy: null,
      },
    });

  await db.insert(adminActionsTable).values({
    adminId: req.user!.id,
    action: "ban",
    targetUserId: userId,
    details: { reason, durationMinutes, isPermanent },
  });

  res.json({ success: true });
});

// ── POST /api/owner/users/:id/unban ────────────────────────────────────
router.post("/owner/users/:id/unban", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const userId = String(req.params.id);

  await db
    .update(userBansTable)
    .set({ unbannedAt: new Date(), unbannedBy: req.user!.id })
    .where(eq(userBansTable.userId, userId));

  await db.insert(adminActionsTable).values({
    adminId: req.user!.id,
    action: "unban",
    targetUserId: userId,
  });

  res.json({ success: true });
});

// ── GET /api/owner/announcements ──────────────────────────────────────────
router.get("/owner/announcements", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db
    .select()
    .from(announcementsTable)
    .orderBy(desc(announcementsTable.createdAt));

  res.json({ announcements: rows });
});

// ── POST /api/owner/announcements ───────────────────────────────────────
router.post("/owner/announcements", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { type, scope, title, message, icon, priority, isPinned, expiresAt, isDraft } = req.body;
  if (!title || !message) {
    res.status(400).json({ error: "Title and message required" });
    return;
  }

  const [row] = await db
    .insert(announcementsTable)
    .values({
      type: type ?? "global",
      scope: scope ?? "all",
      title,
      message,
      icon: icon ?? null,
      priority: priority ?? "normal",
      isPinned: isPinned ?? false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isDraft: isDraft ?? false,
    })
    .returning();

  await db.insert(adminActionsTable).values({
    adminId: req.user!.id,
    action: "announce",
    details: { announcementId: row.id, type },
  });

  res.json({ announcement: row });
});

// ── DELETE /api/owner/announcements/:id ───────────────────────────────
router.delete("/owner/announcements/:id", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { id } = req.params;
  await db.delete(announcementsTable).where(eq(announcementsTable.id, Number(id)));
  res.json({ success: true });
});

// ── GET /api/announcements (public) ──────────────────────────────────────────────
router.get("/announcements", async (req: Request, res: Response): Promise<void> => {
  const now = new Date();

  const rows = await db
    .select()
    .from(announcementsTable)
    .where(
      and(
        eq(announcementsTable.type, "global"),
        eq(announcementsTable.isDraft, false),
        or(
          isNull(announcementsTable.expiresAt),
          gt(announcementsTable.expiresAt, now),
        ),
      ),
    )
    .orderBy(desc(announcementsTable.isPinned), desc(announcementsTable.createdAt));

  res.json({ announcements: rows });
});

// ── GET /api/owner/feedback ──────────────────────────────────────────────────
router.get("/owner/feedback", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db
    .select()
    .from(feedbackTable)
    .orderBy(desc(feedbackTable.createdAt));

  res.json({ feedback: rows });
});

// ── POST /api/owner/feedback/:id/reply ────────────────────────────────
router.post("/owner/feedback/:id/reply", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { id } = req.params;
  const { reply } = req.body;
  if (!reply) {
    res.status(400).json({ error: "Reply required" });
    return;
  }

  await db
    .update(feedbackTable)
    .set({
      ownerReply: reply,
      ownerRepliedAt: new Date(),
      userViewCount: 0,
    })
    .where(eq(feedbackTable.id, Number(id)));

  res.json({ success: true });
});

// ── GET /api/owner/admin-actions ────────────────────────────────────────
router.get("/owner/admin-actions", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db
    .select()
    .from(adminActionsTable)
    .orderBy(desc(adminActionsTable.createdAt))
    .limit(50);

  res.json({ actions: rows });
});

export default router;
