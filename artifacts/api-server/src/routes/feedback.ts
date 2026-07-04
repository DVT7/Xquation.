import { Router, type IRouter, type Request, type Response } from "express";
import { db, feedbackTable } from "@workspace/db";
import { and, eq, desc, isNotNull, sql } from "drizzle-orm";

const router: IRouter = Router();

const AUTO_DISMISS_AFTER = 5; // visits before reply auto-disappears from user view

const VALID_FEATURES = [
  "Formulas", "Constants", "Calculators", "Unit Converter",
  "Read Aloud", "Practice Problems", "Favorites", "Glossary",
  "Donate", "Account", "Other",
];

// POST /api/feedback — submit new feedback (auth required)
router.post("/feedback", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { type, feature, message } = req.body as { type?: unknown; feature?: unknown; message?: unknown };

  if (type !== "suggestion" && type !== "complaint") {
    res.status(400).json({ error: "type must be 'suggestion' or 'complaint'" });
    return;
  }

  if (type === "complaint" && (typeof feature !== "string" || !VALID_FEATURES.includes(feature))) {
    res.status(400).json({ error: "feature is required for complaints" });
    return;
  }

  if (typeof message !== "string" || message.trim().length < 5 || message.trim().length > 2000) {
    res.status(400).json({ error: "message must be between 5 and 2000 characters" });
    return;
  }

  const user = req.user;
  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Anonymous";

  await db.insert(feedbackTable).values({
    type,
    feature: type === "complaint" ? (feature as string) : null,
    message: message.trim(),
    userId: user.id,
    userName,
  });

  res.status(201).json({ success: true });
});

// GET /api/feedback — owner: list only UNREPLIED feedback
router.get("/feedback", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db
    .select()
    .from(feedbackTable)
    .where(eq(feedbackTable.ownerReply, null as unknown as string))
    .orderBy(desc(feedbackTable.createdAt));

  res.json({ feedback: rows });
});

// GET /api/feedback/mine — user: see owner replies to their own feedback.
// Increments userViewCount each call. Items are hidden once dismissed or viewCount >= AUTO_DISMISS_AFTER.
router.get("/feedback/mine", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  // Increment view count for all visible replied-but-not-dismissed items belonging to this user
  await db
    .update(feedbackTable)
    .set({ userViewCount: sql`${feedbackTable.userViewCount} + 1` })
    .where(
      and(
        eq(feedbackTable.userId, userId),
        isNotNull(feedbackTable.ownerReply),
        eq(feedbackTable.userDismissed, false),
      ),
    );

  // Fetch items that are still visible (viewCount < AUTO_DISMISS_AFTER, not dismissed)
  const rows = await db
    .select()
    .from(feedbackTable)
    .where(
      and(
        eq(feedbackTable.userId, userId),
        isNotNull(feedbackTable.ownerReply),
        eq(feedbackTable.userDismissed, false),
        sql`${feedbackTable.userViewCount} <= ${AUTO_DISMISS_AFTER}`,
      ),
    )
    .orderBy(desc(feedbackTable.ownerRepliedAt));

  res.json({ replies: rows });
});

// POST /api/feedback/:id/dismiss — user manually dismisses a reply
router.post("/feedback/:id/dismiss", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db
    .update(feedbackTable)
    .set({ userDismissed: true })
    .where(and(eq(feedbackTable.id, id), eq(feedbackTable.userId, req.user.id)));

  res.json({ success: true });
});

// POST /api/feedback/:id/reply — owner replies to a feedback item
router.post("/feedback/:id/reply", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { reply } = req.body as { reply?: unknown };
  if (typeof reply !== "string" || reply.trim().length < 1) {
    res.status(400).json({ error: "reply is required" });
    return;
  }

  const [updated] = await db
    .update(feedbackTable)
    .set({
      ownerReply: reply.trim(),
      ownerRepliedAt: new Date(),
      // Reset view count so user gets a fresh 5-visit window when a new reply lands
      userViewCount: 0,
      userDismissed: false,
    })
    .where(eq(feedbackTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ success: true, feedback: updated });
});

export default router;
