import { Router, type IRouter, type Request, type Response } from "express";
import { db, favoritesTable, formulaViewsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { GetUserStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/user/stats", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [favRow] = await db
    .select({ cnt: count() })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, req.user.id));

  const [viewRow] = await db
    .select({ cnt: count() })
    .from(formulaViewsTable)
    .where(eq(formulaViewsTable.userId, req.user.id));

  res.json(
    GetUserStatsResponse.parse({
      favoritesCount: Number(favRow?.cnt ?? 0),
      formulasViewed: Number(viewRow?.cnt ?? 0),
    }),
  );
});

export default router;
