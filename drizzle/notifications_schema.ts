import { int, mysqlTable, text, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";

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
