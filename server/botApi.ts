/**
 * Bot API - Trading Bot'un dashboard'a veri göndermesi için endpoint'ler
 */

import { getDb } from "./db";
import { positions, tradeHistory, performanceMetrics } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Yeni pozisyon aç
 */
export async function openPosition(data: {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  positionSize: string;
  riskAmount: string;
  pattern: string;
  confidence: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db.insert(positions).values({
    symbol: data.symbol,
    direction: data.direction,
    entryPrice: data.entryPrice,
    currentPrice: data.entryPrice, // Başlangıçta entry price
    stopLoss: data.stopLoss,
    takeProfit: data.takeProfit,
    positionSize: data.positionSize,
    riskAmount: data.riskAmount,
    pnl: '0.00',
    pnlPercentage: '0.00',
    status: 'OPEN',
    pattern: data.pattern,
    confidence: data.confidence,
    openedAt: new Date(),
  });

  return {
    success: true,
    positionId: result[0].insertId,
    message: 'Position opened successfully',
  };
}

/**
 * Pozisyon güncelle (fiyat, P&L)
 */
export async function updatePosition(data: {
  positionId: number;
  currentPrice: string;
  pnl: string;
  pnlPercentage: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(positions)
    .set({
      currentPrice: data.currentPrice,
      pnl: data.pnl,
      pnlPercentage: data.pnlPercentage,
    })
    .where(eq(positions.id, data.positionId));

  return {
    success: true,
    message: 'Position updated successfully',
  };
}

/**
 * Pozisyon kapat ve trade history'ye ekle
 */
export async function closePosition(data: {
  positionId: number;
  exitPrice: string;
  exitReason: 'TP' | 'SL' | 'MANUAL';
  finalPnl: string;
  finalPnlPercentage: string;
  rRatio: string;
  result: 'WIN' | 'LOSS';
  duration: number; // dakika cinsinden
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Pozisyonu getir
  const [position] = await db.select().from(positions).where(eq(positions.id, data.positionId)).limit(1);
  
  if (!position) {
    throw new Error('Position not found');
  }

  // Trade history'ye ekle
  await db.insert(tradeHistory).values({
    symbol: position.symbol,
    direction: position.direction,
    entryPrice: position.entryPrice,
    exitPrice: data.exitPrice,
    stopLoss: position.stopLoss,
    takeProfit: position.takeProfit,
    positionSize: position.positionSize,
    riskAmount: position.riskAmount,
    pnl: data.finalPnl,
    pnlPercentage: data.finalPnlPercentage,
    rRatio: data.rRatio,
    result: data.result,
    exitReason: data.exitReason,
    pattern: position.pattern,
    confidence: position.confidence,
    duration: data.duration,
    openedAt: position.openedAt,
    closedAt: new Date(),
  });

  // Pozisyonu kapat
  await db.update(positions)
    .set({
      status: 'CLOSED',
      currentPrice: data.exitPrice,
      pnl: data.finalPnl,
      pnlPercentage: data.finalPnlPercentage,
      closedAt: new Date(),
    })
    .where(eq(positions.id, data.positionId));

  return {
    success: true,
    message: 'Position closed successfully',
  };
}

/**
 * Performans metriklerini güncelle
 */
export async function updatePerformanceMetrics(data: {
  date: string;
  startingBalance: string;
  endingBalance: string;
  dailyPnl: string;
  dailyPnlPercentage: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: string;
  averageRRatio: string;
  bestTrade: string;
  worstTrade: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Bugünkü metrik var mı kontrol et
  const [existing] = await db.select().from(performanceMetrics).where(eq(performanceMetrics.date, data.date)).limit(1);

  if (existing) {
    // Güncelle
    await db.update(performanceMetrics)
      .set({
        endingBalance: data.endingBalance,
        dailyPnl: data.dailyPnl,
        dailyPnlPercentage: data.dailyPnlPercentage,
        totalTrades: data.totalTrades,
        winningTrades: data.winningTrades,
        losingTrades: data.losingTrades,
        winRate: data.winRate,
        averageRRatio: data.averageRRatio,
        bestTrade: data.bestTrade,
        worstTrade: data.worstTrade,
      })
      .where(eq(performanceMetrics.date, data.date));
  } else {
    // Yeni ekle
    await db.insert(performanceMetrics).values({
      date: data.date,
      startingBalance: data.startingBalance,
      endingBalance: data.endingBalance,
      dailyPnl: data.dailyPnl,
      dailyPnlPercentage: data.dailyPnlPercentage,
      totalTrades: data.totalTrades,
      winningTrades: data.winningTrades,
      losingTrades: data.losingTrades,
      winRate: data.winRate,
      averageRRatio: data.averageRRatio,
      bestTrade: data.bestTrade,
      worstTrade: data.worstTrade,
    });
  }

  return {
    success: true,
    message: 'Performance metrics updated successfully',
  };
}

/**
 * Tüm açık pozisyonları kapat (Acil Durdur)
 * Hem Binance'deki gerçek pozisyonları hem de database'deki kayıtları kapatır
 */
export async function emergencyStopAll() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // 1. Binance'deki gerçek pozisyonları kapat
  let binanceClosedCount = 0;
  try {
    const { getBotSettings } = await import('./settingsDb');
    const { getBinanceClient, closeAllPositions } = await import('./binance');
    
    const settings = await getBotSettings();
    
    if (settings?.binanceApiKey && settings?.binanceApiSecret && settings?.isConnected) {
      const client = getBinanceClient(settings.binanceApiKey, settings.binanceApiSecret);
      const closedPositions = await closeAllPositions(client);
      binanceClosedCount = closedPositions.length;
      
      console.log(`[Emergency Stop] Binance'de ${binanceClosedCount} pozisyon kapatıldı`);
    }
  } catch (error) {
    console.error('[Emergency Stop] Binance pozisyon kapatma hatası:', error);
    // Binance hatası olsa bile database'deki pozisyonları kapat
  }

  // 2. Database'deki pozisyonları kapat
  const openPositions = await db.select().from(positions).where(eq(positions.status, 'OPEN'));

  let dbClosedCount = 0;

  for (const position of openPositions) {
    // Her pozisyonu kapat (mevcut fiyattan)
    const currentPrice = position.currentPrice;
    const entryPrice = parseFloat(position.entryPrice);
    const current = parseFloat(currentPrice);
    
    const priceDiff = position.direction === 'LONG' 
      ? current - entryPrice 
      : entryPrice - current;
    
    const pnlAmount = (priceDiff / entryPrice) * parseFloat(position.positionSize);
    const pnlPercentage = (priceDiff / entryPrice) * 100;
    const rRatio = pnlAmount / parseFloat(position.riskAmount);

    await closePosition({
      positionId: position.id,
      exitPrice: currentPrice,
      exitReason: 'MANUAL', // Emergency stop
      finalPnl: pnlAmount.toFixed(2),
      finalPnlPercentage: pnlPercentage.toFixed(2),
      rRatio: rRatio.toFixed(2),
      result: pnlAmount >= 0 ? 'WIN' : 'LOSS',
      duration: Math.floor((new Date().getTime() - new Date(position.openedAt).getTime()) / 60000),
    });

    dbClosedCount++;
  }

  // 3. Bildirim gönder
  const { createNotification } = await import('./notificationService');
  await createNotification({
    type: 'EMERGENCY_STOP',
    title: 'Acil Durdur Aktif',
    message: `Tüm pozisyonlar kapatıldı. Binance: ${binanceClosedCount}, Database: ${dbClosedCount}`,
    severity: 'ERROR',
  });

  return {
    success: true,
    binanceClosedCount,
    dbClosedCount,
    totalClosed: binanceClosedCount + dbClosedCount,
    message: `Emergency stop: ${binanceClosedCount + dbClosedCount} positions closed (Binance: ${binanceClosedCount}, DB: ${dbClosedCount})`,
  };
}
