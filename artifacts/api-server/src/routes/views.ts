import { Router, type IRouter, type Request, type Response } from "express";
import { db, formulaViewsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.post("/formulas/:id/view", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const formulaId = parseInt(rawId, 10);
  if (isNaN(formulaId)) {
    res.status(400).json({ error: "Invalid formula id" });
    return;
  }

  await db
    .insert(formulaViewsTable)
    .values({ userId: req.user.id, formulaId })
    .onConflictDoNothing();

  res.status(204).send();
});

export default router;
