import { int, mysqlTable, decimal, boolean, timestamp } from "drizzle-orm/mysql-core";

/**
 * Bot ayarları tablosu
 */
export const botSettings = mysqlTable("bot_settings", {
  id: int("id").autoincrement().primaryKey(),
  totalCapital: decimal("total_capital", { precision: 18, scale: 2 }).notNull(), // Toplam sermaye
  usedCapital: decimal("used_capital", { precision: 18, scale: 2 }).notNull(), // Kullanılacak sermaye
  compoundEnabled: boolean("compound_enabled").default(false).notNull(), // Bileşik getiri aktif mi
  dailyLossLimitPercent: decimal("daily_loss_limit_percent", { precision: 5, scale: 2 }).default('4.00').notNull(), // Günlük kayıp limiti %
  riskPerTradePercent: decimal("risk_per_trade_percent", { precision: 5, scale: 2 }).default('2.00').notNull(), // İşlem başına risk %
  maxDailyTrades: int("max_daily_trades").default(10).notNull(), // Maksimum günlük işlem sayısı
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = typeof botSettings.$inferInsert;
