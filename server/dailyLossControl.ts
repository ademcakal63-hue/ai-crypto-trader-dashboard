import { getDb } from "./db";
import { tradeHistory, botSettings } from "../drizzle/schema";
import { gte, sql } from "drizzle-orm";

/**
 * Bugünkü toplam kaybı hesapla
 */
export async function getTodayLoss(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const trades = await db.select()
    .from(tradeHistory)
    .where(gte(tradeHistory.closedAt, today));

  const totalPnl = trades.reduce((sum, trade) => {
    const pnl = parseFloat(trade.pnl);
    return sum + (pnl < 0 ? pnl : 0); // Sadece kayıpları topla
  }, 0);

  return Math.abs(totalPnl);
}

/**
 * Günlük kayıp limitini kontrol et
 * @returns { exceeded: boolean, currentLoss: number, limit: number, remaining: number }
 */
export async function checkDailyLossLimit() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Bot ayarlarını al
  const [settings] = await db.select().from(botSettings).limit(1);
  if (!settings) {
    throw new Error("Bot settings not found");
  }

  // Günlük kayıp limitini hesapla
  const dailyLossLimitPercent = parseFloat(settings.dailyLossLimitPercent);
  
  // Gerçek sermayeyi hesapla (balance_helper.py mantığı ile aynı)
  // TODO: Gerçek bakiyeyi Binance'den çek
  const capital = 1000; // Placeholder
  const dailyLossLimit = (capital * dailyLossLimitPercent) / 100;

  // Bugünkü kaybı hesapla
  const currentLoss = await getTodayLoss();

  const exceeded = currentLoss >= dailyLossLimit;
  const remaining = Math.max(0, dailyLossLimit - currentLoss);

  return {
    exceeded,
    currentLoss,
    limit: dailyLossLimit,
    remaining,
    percentage: (currentLoss / dailyLossLimit) * 100,
  };
}

/**
 * Günlük kayıp limiti aşıldıysa bot'u otomatik durdur
 */
export async function autoStopIfLimitExceeded() {
  const status = await checkDailyLossLimit();

  if (status.exceeded) {
    // Bot'u durdur
    const { toggleBot } = await import('./settingsDb');
    await toggleBot(false, false); // Pozisyonları kapatma, sadece durdur

    // Bildirim gönder
    const { createNotification } = await import('./notificationService');
    await createNotification({
      type: "DAILY_LIMIT_REACHED",
      title: "Günlük Kayıp Limiti Aşıldı",
      message: `Bugünkü kayıp $${status.currentLoss.toFixed(2)} USDT. Limit: $${status.limit.toFixed(2)} USDT. Bot otomatik olarak durduruldu.`,
      severity: "ERROR",
    });

    return { stopped: true, reason: "Daily loss limit exceeded" };
  }

  // Limit yaklaşıyorsa uyarı (80% doldu)
  if (status.percentage >= 80 && status.percentage < 100) {
    const { createNotification } = await import('./notificationService');
    await createNotification({
      type: "RISK_LIMIT_WARNING",
      title: "Günlük Kayıp Limitine Yaklaşıldı",
      message: `Bugünkü kayıp $${status.currentLoss.toFixed(2)} USDT (${status.percentage.toFixed(0)}%). Kalan: $${status.remaining.toFixed(2)} USDT.`,
      severity: "WARNING",
    });
  }

  return { stopped: false };
}
