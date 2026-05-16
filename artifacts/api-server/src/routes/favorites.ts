import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, favoritesTable } from "@workspace/db";
import {
  AddFavoriteBody,
  RemoveFavoriteParams,
  ListFavoritesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/favorites", async (_req, res): Promise<void> => {
  const favorites = await db.select().from(favoritesTable).orderBy(favoritesTable.createdAt);
  const serialized = favorites.map(f => ({ ...f, createdAt: f.createdAt?.toISOString() }));
  res.json(ListFavoritesResponse.parse(serialized));
});

router.post("/favorites", async (req, res): Promise<void> => {
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [favorite] = await db.insert(favoritesTable).values(parsed.data).returning();
  res.status(201).json(favorite);
});

router.delete("/favorites/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemoveFavoriteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(favoritesTable).where(eq(favoritesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Favorite not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
