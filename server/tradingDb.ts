import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { positions, tradeHistory, performanceMetrics, aiLearning } from "../drizzle/schema";

/**
 * Açık pozisyonları getir
 */
export async function getOpenPositions() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(positions)
    .where(eq(positions.status, "OPEN"))
    .orderBy(desc(positions.openedAt));
}

/**
 * İşlem geçmişini getir (son N işlem)
 */
export async function getTradeHistory(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(tradeHistory)
    .orderBy(desc(tradeHistory.closedAt))
    .limit(limit);
}

/**
 * Bugünkü performans metriklerini getir
 */
export async function getTodayPerformance() {
  const db = await getDb();
  if (!db) return null;
  
  const today = new Date().toISOString().split('T')[0];
  
  const result = await db
    .select()
    .from(performanceMetrics)
    .where(eq(performanceMetrics.date, today))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Son N günün performans metriklerini getir
 */
export async function getPerformanceHistory(days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(performanceMetrics)
    .orderBy(desc(performanceMetrics.date))
    .limit(days);
}

/**
 * En son AI öğrenme durumunu getir
 */
export async function getLatestAiLearning() {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(aiLearning)
    .orderBy(desc(aiLearning.createdAt))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Dashboard özet verileri (tek sorguda)
 */
export async function getDashboardSummary() {
  const [openPos, todayPerf, latestAi] = await Promise.all([
    getOpenPositions(),
    getTodayPerformance(),
    getLatestAiLearning(),
  ]);
  
  // Toplam açık pozisyon P&L hesapla
  const totalOpenPnl = openPos.reduce((sum, pos) => {
    const pnl = parseFloat(pos.pnl);
    return sum + pnl;
  }, 0);
  
  return {
    openPositions: openPos,
    openPositionsCount: openPos.length,
    totalOpenPnl: totalOpenPnl.toFixed(2),
    todayPerformance: todayPerf,
    aiLearning: latestAi,
  };
}
