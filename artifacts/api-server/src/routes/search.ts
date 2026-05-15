import { Router, type IRouter } from "express";
import { ilike, or } from "drizzle-orm";
import { db, formulasTable, constantsTable, problemsTable, glossaryTable } from "@workspace/db";
import { GlobalSearchQueryParams, GlobalSearchResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const parsed = GlobalSearchQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q } = parsed.data;
  const term = `%${q}%`;

  const [formulas, constants, problems, glossary] = await Promise.all([
    db.select().from(formulasTable).where(
      or(ilike(formulasTable.name, term), ilike(formulasTable.description, term))
    ),
    db.select().from(constantsTable).where(
      or(ilike(constantsTable.name, term), ilike(constantsTable.symbol, term), ilike(constantsTable.description, term))
    ),
    db.select().from(problemsTable).where(
      or(ilike(problemsTable.question, term), ilike(problemsTable.topic, term))
    ),
    db.select().from(glossaryTable).where(
      or(ilike(glossaryTable.term, term), ilike(glossaryTable.definition, term))
    ),
  ]);

  res.json(GlobalSearchResponse.parse({ formulas, constants, problems, glossary }));
});

export default router;
