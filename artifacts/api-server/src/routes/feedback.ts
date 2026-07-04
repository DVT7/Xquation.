import { Router, type IRouter, type Request, type Response } from "express";
import { db, feedbackTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const VALID_FEATURES = [
  "Formulas", "Constants", "Calculators", "Unit Converter",
  "Read Aloud", "Practice Problems", "Favorites", "Glossary",
  "Donate", "Account", "Other",
];

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

router.get("/feedback", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db
    .select()
    .from(feedbackTable)
    .orderBy(desc(feedbackTable.createdAt));

  res.json({ feedback: rows });
});

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
    .set({ ownerReply: reply.trim(), ownerRepliedAt: new Date() })
    .where(eq(feedbackTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ success: true, feedback: updated });
});

export default router;
