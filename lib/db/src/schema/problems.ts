import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const problemsTable = pgTable("problems", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  question: text("question").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  hint: text("hint"),
  solution: text("solution"),
  answer: text("answer"),
});

export const insertProblemSchema = createInsertSchema(problemsTable).omit({ id: true });
export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Problem = typeof problemsTable.$inferSelect;
