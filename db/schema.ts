import { pgTable, uuid, text, timestamp, decimal, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const prices = pgTable("prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  item_id: uuid("item_id")
    .references(() => items.id)
    .notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  unique_item_date: unique().on(table.item_id, table.date)
}));

export const insertItemSchema = createInsertSchema(items);
export const selectItemSchema = createSelectSchema(items);
export const insertPriceSchema = createInsertSchema(prices);
export const selectPriceSchema = createSelectSchema(prices);

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type Price = typeof prices.$inferSelect;
export type InsertPrice = typeof prices.$inferInsert;
