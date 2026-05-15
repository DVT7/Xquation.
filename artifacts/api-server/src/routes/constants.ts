import { Router, type IRouter } from "express";
import { ilike, eq, or } from "drizzle-orm";
import { db, constantsTable } from "@workspace/db";
import {
  ListConstantsQueryParams,
  GetConstantParams,
  ListConstantsResponse,
  GetConstantResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/constants", async (req, res): Promise<void> => {
  const parsed = ListConstantsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search } = parsed.data;
  let query = db.select().from(constantsTable).$dynamic();

  if (search) {
    query = query.where(
      or(
        ilike(constantsTable.name, `%${search}%`),
        ilike(constantsTable.symbol, `%${search}%`),
        ilike(constantsTable.description, `%${search}%`)
      )
    ) as typeof query;
  }

  const constants = await query;
  res.json(ListConstantsResponse.parse(constants));
});

router.get("/constants/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetConstantParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [constant] = await db.select().from(constantsTable).where(eq(constantsTable.id, params.data.id));
  if (!constant) {
    res.status(404).json({ error: "Constant not found" });
    return;
  }

  res.json(GetConstantResponse.parse(constant));
});

export default router;
