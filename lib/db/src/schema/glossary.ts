import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const glossaryTable = pgTable("glossary", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  category: text("category"),
});

export const insertGlossarySchema = createInsertSchema(glossaryTable).omit({ id: true });
export type InsertGlossary = z.infer<typeof insertGlossarySchema>;
export type GlossaryTerm = typeof glossaryTable.$inferSelect;
