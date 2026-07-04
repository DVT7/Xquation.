import { Router, type IRouter, type Request, type Response } from "express";
import { db, feedbackTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/feedback", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { type, message } = req.body as { type?: unknown; message?: unknown };

  if (type !== "suggestion" && type !== "complaint") {
    res.status(400).json({ error: "type must be 'suggestion' or 'complaint'" });
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
    message: message.trim(),
    userId: user.id,
    userName,
  });

  res.status(201).json({ success: true });
});

export default router;
