import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, favoritesTable } from "@workspace/db";
import {
  AddFavoriteBody,
  RemoveFavoriteParams,
  ListFavoritesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Schwarzschild Radius Easter-egg formula ID
const SCHWARZSCHILD_ID = 28;

router.get("/favorites", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const favorites = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, req.user.id))
    .orderBy(favoritesTable.createdAt);
  const serialized = favorites.map(f => ({ ...f, createdAt: f.createdAt?.toISOString() }));
  res.json(ListFavoritesResponse.parse(serialized));
});

router.post("/favorites", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [favorite] = await db
    .insert(favoritesTable)
    .values({ ...parsed.data, userId: req.user.id })
    .returning();
  res.status(201).json(favorite);
});

router.delete("/favorites/:id", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemoveFavoriteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(favoritesTable)
    .where(and(eq(favoritesTable.id, params.data.id), eq(favoritesTable.userId, req.user.id)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Favorite not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
export { SCHWARZSCHILD_ID };
