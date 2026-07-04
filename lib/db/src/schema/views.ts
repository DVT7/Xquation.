import { pgTable, serial, integer, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const formulaViewsTable = pgTable(
  "formula_views",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull(),
    formulaId: integer("formula_id").notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("unique_user_formula").on(table.userId, table.formulaId)],
);

export type FormulaView = typeof formulaViewsTable.$inferSelect;
