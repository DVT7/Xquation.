import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  limboProgressTable,
  type LimboProgress,
} from "@workspace/db";
import {
  GetLimboStateResponse,
  RecordLimboAttemptBody,
  RecordLimboAttemptResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const MAX_WRONG_COLORS = 6;
const VALID_COLORS = new Set([
  "orange",
  "lime",
  "green",
  "red",
  "dark blue",
  "light blue",
  "pink",
  "purple",
]);

function toState(progress?: LimboProgress | null) {
  const wrongColors = progress?.wrongColors ?? [];
  return {
    wrongColors,
    centerActivated: progress?.centerActivated ?? false,
    completed: wrongColors.length >= MAX_WRONG_COLORS,
    completedAt: progress?.completedAt?.toISOString() ?? null,
  };
}

router.get("/limbo/state", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [progress] = await db
    .select()
    .from(limboProgressTable)
    .where(eq(limboProgressTable.userId, req.user!.id));

  res.json(GetLimboStateResponse.parse(toState(progress)));
});

router.post("/limbo/attempt", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = RecordLimboAttemptBody.safeParse(req.body);
  if (!parsed.success || !VALID_COLORS.has(parsed.data.color)) {
    res.status(400).json({ error: "Invalid Limbo attempt." });
    return;
  }

  const [existing] = await db
    .select()
    .from(limboProgressTable)
    .where(eq(limboProgressTable.userId, req.user!.id));

  const wrongColors = [...(existing?.wrongColors ?? [])];
  if (parsed.data.outcome === "wrong" && !wrongColors.includes(parsed.data.color)) {
    wrongColors.push(parsed.data.color);
  }
  const completed = wrongColors.length >= MAX_WRONG_COLORS;
  const next = {
    userId: req.user!.id,
    wrongColors,
    centerActivated: existing?.centerActivated || parsed.data.outcome === "correct",
    completedAt: completed ? (existing?.completedAt ?? new Date()) : existing?.completedAt ?? null,
    updatedAt: new Date(),
  };

  await db
    .insert(limboProgressTable)
    .values(next)
    .onConflictDoUpdate({
      target: limboProgressTable.userId,
      set: {
        wrongColors: next.wrongColors,
        centerActivated: next.centerActivated,
        completedAt: next.completedAt,
        updatedAt: next.updatedAt,
      },
    });

  res.json(RecordLimboAttemptResponse.parse(toState(next)));
});

export default router;