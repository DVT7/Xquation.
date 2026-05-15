import { Router, type IRouter } from "express";
import { db, formulasTable, constantsTable, problemsTable, glossaryTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { GetStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [formulaCount, constantCount, problemCount, glossaryCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(formulasTable),
    db.select({ count: sql<number>`count(*)::int` }).from(constantsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(problemsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(glossaryTable),
  ]);

  const categories = await db.select({ category: formulasTable.category }).from(formulasTable);
  const uniqueCategories = new Set(categories.map(c => c.category)).size;

  res.json(GetStatsResponse.parse({
    formulaCount: formulaCount[0]?.count ?? 0,
    constantCount: constantCount[0]?.count ?? 0,
    problemCount: problemCount[0]?.count ?? 0,
    glossaryCount: glossaryCount[0]?.count ?? 0,
    categoryCount: uniqueCategories,
  }));
});

export default router;
