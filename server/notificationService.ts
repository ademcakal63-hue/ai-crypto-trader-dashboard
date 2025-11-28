/**
 * Bildirim Sistemi
 * Gerçek zamanlı bildirimler için helper fonksiyonlar
 */

import { getDb } from "./db";
import { notifications } from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";

type NotificationType = 
  | "POSITION_OPENED"
  | "POSITION_CLOSED"
  | "RISK_LIMIT_WARNING"
  | "DAILY_LIMIT_REACHED"
  | "CONNECTION_LOST"
  | "CONNECTION_RESTORED"
  | "EMERGENCY_STOP";

type NotificationSeverity = "INFO" | "WARNING" | "ERROR" | "SUCCESS";

/**
 * Yeni bildirim oluştur
 */
export async function createNotification(data: {
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  data?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.insert(notifications).values({
    type: data.type,
    title: data.title,
    message: data.message,
    severity: data.severity,
    data: data.data ? JSON.stringify(data.data) : null,
    read: false,
  });

  return { success: true };
}

/**
 * Tüm bildirimleri getir
 */
export async function getNotifications(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Okunmamış bildirimleri getir
 */
export async function getUnreadNotifications() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.read, false))
    .orderBy(desc(notifications.createdAt));
}

/**
 * Bildirimi okundu olarak işaretle
 */
export async function markAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId));

  return { success: true };
}

/**
 * Tüm bildirimleri okundu olarak işaretle
 */
export async function markAllAsRead() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.read, false));

  return { success: true };
}

/**
 * Pozisyon açıldı bildirimi
 */
export async function notifyPositionOpened(position: {
  symbol: string;
  direction: string;
  entryPrice: string;
  pattern: string;
}) {
  return await createNotification({
    type: "POSITION_OPENED",
    title: "Yeni Pozisyon Açıldı",
    message: `${position.symbol} ${position.direction} pozisyonu $${position.entryPrice} fiyatından açıldı.`,
    severity: "INFO",
    data: position,
  });
}

/**
 * Pozisyon kapandı bildirimi
 */
export async function notifyPositionClosed(trade: {
  symbol: string;
  direction: string;
  pnl: string;
  result: string;
  exitReason: string;
}) {
  return await createNotification({
    type: "POSITION_CLOSED",
    title: `Pozisyon Kapandı (${trade.result})`,
    message: `${trade.symbol} ${trade.direction} pozisyonu ${trade.exitReason} ile kapandı. P&L: ${trade.pnl}`,
    severity: trade.result === 'WIN' ? "SUCCESS" : "ERROR",
    data: trade,
  });
}

/**
 * Risk limiti uyarısı
 */
export async function notifyRiskLimitWarning(data: {
  usedRisk: number;
  totalLimit: number;
  percentage: number;
}) {
  return await createNotification({
    type: "RISK_LIMIT_WARNING",
    title: "Risk Limiti Uyarısı",
    message: `Günlük risk limitinin %${data.percentage.toFixed(0)}'ine ulaştınız. Kullanılan: $${data.usedRisk.toFixed(2)} / Limit: $${data.totalLimit.toFixed(2)}`,
    severity: "WARNING",
    data,
  });
}

/**
 * Günlük limit doldu bildirimi
 */
export async function notifyDailyLimitReached() {
  return await createNotification({
    type: "DAILY_LIMIT_REACHED",
    title: "Günlük Limit Doldu",
    message: "Günlük kayıp limitine ulaştınız. Yeni pozisyon açılamaz.",
    severity: "ERROR",
  });
}

/**
 * Bağlantı kesildi bildirimi
 */
export async function notifyConnectionLost() {
  return await createNotification({
    type: "CONNECTION_LOST",
    title: "Bağlantı Kesildi",
    message: "Binance WebSocket bağlantısı kesildi. Yeniden bağlanılıyor...",
    severity: "WARNING",
  });
}

/**
 * Bağlantı yeniden kuruldu bildirimi
 */
export async function notifyConnectionRestored() {
  return await createNotification({
    type: "CONNECTION_RESTORED",
    title: "Bağlantı Yeniden Kuruldu",
    message: "Binance WebSocket bağlantısı başarıyla yeniden kuruldu.",
    severity: "SUCCESS",
  });
}

/**
 * Acil durdur bildirimi
 */
export async function notifyEmergencyStop(closedCount: number) {
  return await createNotification({
    type: "EMERGENCY_STOP",
    title: "Acil Durdur Aktif",
    message: `Tüm açık pozisyonlar kapatıldı. Toplam ${closedCount} pozisyon kapatıldı.`,
    severity: "ERROR",
    data: { closedCount },
  });
}
