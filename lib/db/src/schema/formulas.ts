import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const formulasTable = pgTable("formulas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  latex: text("latex").notNull(),
  description: text("description").notNull(),
  variables: text("variables").notNull().default(""),
  siUnits: text("si_units"),
  example: text("example"),
  relatedFormulas: text("related_formulas"),
  calculator: text("calculator"),
  isFeatured: boolean("is_featured").notNull().default(false),
});

export const insertFormulaSchema = createInsertSchema(formulasTable).omit({ id: true });
export type InsertFormula = z.infer<typeof insertFormulaSchema>;
export type Formula = typeof formulasTable.$inferSelect;
