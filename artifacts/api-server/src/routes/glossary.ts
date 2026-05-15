import { Router, type IRouter } from "express";
import { ilike, eq, or } from "drizzle-orm";
import { db, glossaryTable } from "@workspace/db";
import {
  ListGlossaryTermsQueryParams,
  GetGlossaryTermParams,
  ListGlossaryTermsResponse,
  GetGlossaryTermResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/glossary", async (req, res): Promise<void> => {
  const parsed = ListGlossaryTermsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search } = parsed.data;
  let query = db.select().from(glossaryTable).$dynamic();

  if (search) {
    query = query.where(
      or(
        ilike(glossaryTable.term, `%${search}%`),
        ilike(glossaryTable.definition, `%${search}%`)
      )
    ) as typeof query;
  }

  const terms = await query;
  res.json(ListGlossaryTermsResponse.parse(terms));
});

router.get("/glossary/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetGlossaryTermParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [term] = await db.select().from(glossaryTable).where(eq(glossaryTable.id, params.data.id));
  if (!term) {
    res.status(404).json({ error: "Glossary term not found" });
    return;
  }

  res.json(GetGlossaryTermResponse.parse(term));
});

export default router;
