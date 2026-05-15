import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const constantsTable = pgTable("constants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  value: text("value").notNull(),
  units: text("units").notNull(),
  description: text("description").notNull(),
  category: text("category"),
});

export const insertConstantSchema = createInsertSchema(constantsTable).omit({ id: true });
export type InsertConstant = z.infer<typeof insertConstantSchema>;
export type Constant = typeof constantsTable.$inferSelect;
