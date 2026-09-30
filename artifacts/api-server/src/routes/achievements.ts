import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetAchievementsResponse,
  GrantOwnerAchievementBody,
  ListOwnerAchievementsResponse,
  RecordAchievementEventResponse,
  UpdateOwnerAchievementBody,
  UpdateOwnerAchievementParams,
  UpdateOwnerAchievementResponse,
} from "@workspace/api-zod";
import { RecordAchievementEventBody } from "@workspace/api-zod";
import { ACHIEVEMENT_DEFINITIONS, type AchievementKey } from "@workspace/db";
import {
  getOwnerAchievementSettings,
  getUserAchievements,
  grantAchievement,
  recordAchievementEvent,
  setAchievementEnabled,
} from "../lib/achievements";

const router: IRouter = Router();

router.get("/achievements", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(GetAchievementsResponse.parse({ achievements: await getUserAchievements(req.user!.id) }));
});

router.post("/achievements/events", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = RecordAchievementEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid achievement event." });
    return;
  }
  const completed = await recordAchievementEvent(req.user!.id, parsed.data.event, parsed.data.amount);
  res.json(RecordAchievementEventResponse.parse({ completed }));
});

router.get("/owner/achievements", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(ListOwnerAchievementsResponse.parse({ achievements: await getOwnerAchievementSettings() }));
});

router.patch("/owner/achievements/:key", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const params = UpdateOwnerAchievementParams.safeParse(req.params);
  const body = UpdateOwnerAchievementBody.safeParse(req.body);
  const key = params.success ? params.data.key : "";
  if (
    !params.success ||
    !body.success ||
    !ACHIEVEMENT_DEFINITIONS.some((definition) => definition.key === key)
  ) {
    res.status(400).json({ error: "Invalid achievement setting." });
    return;
  }
  const achievement = await setAchievementEnabled(key as AchievementKey, body.data.enabled);
  res.json(UpdateOwnerAchievementResponse.parse(achievement));
});

router.post("/owner/achievements/:key/grant", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || req.user!.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const params = UpdateOwnerAchievementParams.safeParse(req.params);
  const body = GrantOwnerAchievementBody.safeParse(req.body);
  const key = params.success ? params.data.key : "";
  if (
    !params.success ||
    !body.success ||
    !ACHIEVEMENT_DEFINITIONS.some((definition) => definition.key === key)
  ) {
    res.status(400).json({ error: "Invalid achievement grant." });
    return;
  }
  const achievements = await grantAchievement(body.data.userId, key as AchievementKey);
  if (!achievements) {
    res.status(400).json({ error: "Account not found." });
    return;
  }
  res.json(GetAchievementsResponse.parse({ achievements }));
});

export default router;