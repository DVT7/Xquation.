import { Router, type IRouter } from "express";
import { ilike, eq, or } from "drizzle-orm";
import { db, formulasTable } from "@workspace/db";
import {
  ListFormulasQueryParams,
  GetFormulaParams,
  ListFormulasResponse,
  GetFormulaResponse,
  ListFormulaCategoriesResponse,
  ListFeaturedFormulasResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/formulas/categories", async (_req, res): Promise<void> => {
  const formulas = await db.select({ category: formulasTable.category }).from(formulasTable);
  const counts: Record<string, number> = {};
  for (const f of formulas) {
    counts[f.category] = (counts[f.category] ?? 0) + 1;
  }
  const result = Object.entries(counts).map(([category, count]) => ({ category, count }));
  res.json(ListFormulaCategoriesResponse.parse(result));
});

router.get("/formulas/featured", async (_req, res): Promise<void> => {
  console.log("FORMULAS ROUTE HIT");
  const formulas = await db.select().from(formulasTable).where(eq(formulasTable.isFeatured, true));
  res.json(ListFeaturedFormulasResponse.parse(formulas));
});

router.get("/formulas", async (req, res): Promise<void> => {
  const parsed = ListFormulasQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, search } = parsed.data;

  let query = db.select().from(formulasTable).$dynamic();

  if (category && search) {
    query = query.where(
      or(
        ilike(formulasTable.name, `%${search}%`),
        ilike(formulasTable.description, `%${search}%`)
      )
    ) as typeof query;
    const all = await query;
    res.json(ListFormulasResponse.parse(all.filter(f => f.category === category)));
    return;
  }

  if (category) {
    query = query.where(eq(formulasTable.category, category)) as typeof query;
  }

  if (search) {
    query = query.where(
      or(
        ilike(formulasTable.name, `%${search}%`),
        ilike(formulasTable.description, `%${search}%`)
      )
    ) as typeof query;
  }
  console.log("ABOUT TO QUERY FORMULAS");

try {
  const formulas = await query;
  res.json(ListFormulasResponse.parse(formulas));
} catch (error) {
  console.error("FORMULAS DB ERROR:", error);
  throw error;
}
  res.json(ListFormulasResponse.parse(formulas));
});

router.get("/formulas/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetFormulaParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [formula] = await db.select().from(formulasTable).where(eq(formulasTable.id, params.data.id));
  if (!formula) {
    res.status(404).json({ error: "Formula not found" });
    return;
  }

  res.json(GetFormulaResponse.parse(formula));
});

export default router;
