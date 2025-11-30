import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Bildirimler tablosu
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "POSITION_OPENED",
    "POSITION_CLOSED",
    "RISK_LIMIT_WARNING",
    "DAILY_LIMIT_REACHED",
    "CONNECTION_LOST",
    "CONNECTION_RESTORED",
    "EMERGENCY_STOP",
  ]).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: mysqlEnum("severity", ["INFO", "WARNING", "ERROR", "SUCCESS"]).notNull(),
  read: boolean("read").default(false).notNull(),
  data: text("data"), // JSON string (pozisyon detayları vs.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Açık pozisyonlar tablosu
 */
export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(), // BTCUSDT, ETHUSDT, etc.
  direction: mysqlEnum("direction", ["LONG", "SHORT"]).notNull(),
  entryPrice: varchar("entry_price", { length: 20 }).notNull(),
  currentPrice: varchar("current_price", { length: 20 }).notNull(),
  stopLoss: varchar("stop_loss", { length: 20 }).notNull(),
  takeProfit: varchar("take_profit", { length: 20 }).notNull(),
  positionSize: varchar("position_size", { length: 20 }).notNull(), // USDT cinsinden
  riskAmount: varchar("risk_amount", { length: 20 }).notNull(), // Risk edilen miktar
  pnl: varchar("pnl", { length: 20 }).notNull(), // Anlık kar/zarar
  pnlPercentage: varchar("pnl_percentage", { length: 10 }).notNull(),
  status: mysqlEnum("status", ["OPEN", "CLOSED"]).default("OPEN").notNull(),
  pattern: text("pattern"), // Hangi pattern kullanıldı (FVG, OB, Sweep, etc.)
  confidence: varchar("confidence", { length: 10 }), // Güven skoru
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

/**
 * İşlem geçmişi tablosu
 */
export const tradeHistory = mysqlTable("trade_history", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  direction: mysqlEnum("direction", ["LONG", "SHORT"]).notNull(),
  entryPrice: varchar("entry_price", { length: 20 }).notNull(),
  exitPrice: varchar("exit_price", { length: 20 }).notNull(),
  stopLoss: varchar("stop_loss", { length: 20 }).notNull(),
  takeProfit: varchar("take_profit", { length: 20 }).notNull(),
  positionSize: varchar("position_size", { length: 20 }).notNull(),
  riskAmount: varchar("risk_amount", { length: 20 }).notNull(),
  pnl: varchar("pnl", { length: 20 }).notNull(),
  pnlPercentage: varchar("pnl_percentage", { length: 10 }).notNull(),
  rRatio: varchar("r_ratio", { length: 10 }).notNull(), // Reward/Risk oranı
  result: mysqlEnum("result", ["WIN", "LOSS"]).notNull(),
  exitReason: varchar("exit_reason", { length: 50 }).notNull(), // TP, SL, MANUAL
  pattern: text("pattern"),
  confidence: varchar("confidence", { length: 10 }),
  duration: int("duration"), // Süre (dakika)
  openedAt: timestamp("opened_at").notNull(),
  closedAt: timestamp("closed_at").notNull(),
});

export type TradeHistory = typeof tradeHistory.$inferSelect;
export type InsertTradeHistory = typeof tradeHistory.$inferInsert;

/**
 * Performans metrikleri tablosu (günlük)
 */
export const performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(), // YYYY-MM-DD
  startingBalance: varchar("starting_balance", { length: 20 }).notNull(),
  endingBalance: varchar("ending_balance", { length: 20 }).notNull(),
  dailyPnl: varchar("daily_pnl", { length: 20 }).notNull(),
  dailyPnlPercentage: varchar("daily_pnl_percentage", { length: 10 }).notNull(),
  totalTrades: int("total_trades").notNull(),
  winningTrades: int("winning_trades").notNull(),
  losingTrades: int("losing_trades").notNull(),
  winRate: varchar("win_rate", { length: 10 }).notNull(), // Percentage
  averageRRatio: varchar("average_r_ratio", { length: 10 }).notNull(),
  bestTrade: varchar("best_trade", { length: 20 }),
  worstTrade: varchar("worst_trade", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetrics = typeof performanceMetrics.$inferInsert;

/**
 * AI öğrenme durumu tablosu
 */
export const aiLearning = mysqlTable("ai_learning", {
  id: int("id").autoincrement().primaryKey(),
  modelVersion: varchar("model_version", { length: 20 }).notNull(), // v1.0, v1.1, v1.2
  patternsLearned: int("patterns_learned").notNull(), // Kaç pattern öğrenildi
  expertTradesIntegrated: int("expert_trades_integrated").notNull(),
  lastFineTuneDate: timestamp("last_fine_tune_date").notNull(),
  improvements: text("improvements"), // JSON: hangi iyileştirmeler yapıldı
  performanceBeforeTuning: varchar("performance_before_tuning", { length: 10 }),
  performanceAfterTuning: varchar("performance_after_tuning", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiLearning = typeof aiLearning.$inferSelect;
export type InsertAiLearning = typeof aiLearning.$inferInsert;

/**
 * Bot ayarları tablosu
 */
export const botSettings = mysqlTable("bot_settings", {
  id: int("id").autoincrement().primaryKey(),
  binanceApiKey: text("binance_api_key"), // Binance API Key (encrypted)
  binanceApiSecret: text("binance_api_secret"), // Binance API Secret (encrypted)
  isConnected: boolean("is_connected").default(false).notNull(), // Hesap bağlı mı
  isActive: boolean("is_active").default(false).notNull(), // Bot aktif mi (başlat/durdur)
  capitalLimit: varchar("capital_limit", { length: 20 }), // Opsiyonel: Maksimum kullanılacak sermaye (null = sınırsız)
  useAllBalance: boolean("use_all_balance").default(true).notNull(), // Tüm bakiyeyi kullan (default: true)
  compoundEnabled: boolean("compound_enabled").default(false).notNull(), // Bileşik getiri aktif mi
  dailyLossLimitPercent: varchar("daily_loss_limit_percent", { length: 10 }).default('4.00').notNull(), // Günlük kayıp limiti %
  riskPerTradePercent: varchar("risk_per_trade_percent", { length: 10 }).default('2.00').notNull(), // İşlem başına risk %
  maxDailyTrades: int("max_daily_trades").default(10).notNull(), // Maksimum günlük işlem sayısı
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = typeof botSettings.$inferInsert;
