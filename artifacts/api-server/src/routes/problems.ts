import { Router, type IRouter } from "express";
import { ilike, eq, and, or } from "drizzle-orm";
import { db, problemsTable } from "@workspace/db";
import {
  ListProblemsQueryParams,
  GetProblemParams,
  ListProblemsResponse,
  GetProblemResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/problems", async (req, res): Promise<void> => {
  const parsed = ListProblemsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { topic, difficulty, search } = parsed.data;

  let query = db.select().from(problemsTable).$dynamic();
  const conditions = [];

  if (topic) {
    conditions.push(eq(problemsTable.topic, topic));
  }
  if (difficulty) {
    conditions.push(eq(problemsTable.difficulty, difficulty));
  }
  if (search) {
    conditions.push(
      or(
        ilike(problemsTable.question, `%${search}%`),
        ilike(problemsTable.topic, `%${search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const problems = await query;
  res.json(ListProblemsResponse.parse(problems));
});

router.get("/problems/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProblemParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [problem] = await db.select().from(problemsTable).where(eq(problemsTable.id, params.data.id));
  if (!problem) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }

  res.json(GetProblemResponse.parse(problem));
});

export default router;
