/**
 * Demo Trading Verileri Oluşturma Script'i
 * Gerçekçi trading verileriyle database'i doldurur
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { positions, tradeHistory, performanceMetrics, aiLearning } from '../drizzle/schema.js';

// Database bağlantısı
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Bugünün tarihi
const today = new Date();
const formatDate = (date) => date.toISOString().split('T')[0];

console.log('🌱 Demo verileri oluşturuluyor...\n');

// 1. Açık Pozisyonlar (3 adet)
console.log('📊 Açık pozisyonlar oluşturuluyor...');

const openPositions = [
  {
    symbol: 'BTCUSDT',
    direction: 'LONG',
    entryPrice: '96500.00',
    currentPrice: '96850.00', // +350 puan kârda
    stopLoss: '96200.00',
    takeProfit: '97400.00',
    positionSize: '30.00', // $30 risk (%2)
    riskAmount: '30.00',
    pnl: '+10.87', // Anlık kâr
    pnlPercentage: '+0.36',
    status: 'OPEN',
    pattern: 'Order Block + FVG',
    confidence: '0.85',
    openedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat önce
  },
  {
    symbol: 'ETHUSDT',
    direction: 'LONG',
    entryPrice: '3650.00',
    currentPrice: '3668.00', // +18 puan kârda
    stopLoss: '3630.00',
    takeProfit: '3710.00',
    positionSize: '30.00',
    riskAmount: '30.00',
    pnl: '+14.80',
    pnlPercentage: '+0.49',
    status: 'OPEN',
    pattern: 'Liquidity Sweep + OB',
    confidence: '0.90',
    openedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 saat önce
  },
  {
    symbol: 'SOLUSDT',
    direction: 'SHORT',
    entryPrice: '245.50',
    currentPrice: '246.20', // -0.70 puan zararda
    stopLoss: '247.00',
    takeProfit: '242.00',
    positionSize: '30.00',
    riskAmount: '30.00',
    pnl: '-14.00',
    pnlPercentage: '-0.29',
    status: 'OPEN',
    pattern: 'Bearish FVG',
    confidence: '0.75',
    openedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 saat önce
  },
];

for (const pos of openPositions) {
  await db.insert(positions).values({
    symbol: pos.symbol,
    direction: pos.direction,
    entryPrice: pos.entryPrice,
    currentPrice: pos.currentPrice,
    stopLoss: pos.stopLoss,
    takeProfit: pos.takeProfit,
    positionSize: pos.positionSize,
    riskAmount: pos.riskAmount,
    pnl: pos.pnl,
    pnlPercentage: pos.pnlPercentage,
    status: pos.status,
    pattern: pos.pattern,
    confidence: pos.confidence,
    openedAt: pos.openedAt,
  });
}

console.log(`✅ ${openPositions.length} açık pozisyon oluşturuldu\n`);

// 2. İşlem Geçmişi (Son 20 işlem)
console.log('📜 İşlem geçmişi oluşturuluyor...');

const trades = [
  // Bugünkü işlemler (3 adet)
  {
    symbol: 'BTCUSDT',
    direction: 'LONG',
    entryPrice: '95800.00',
    exitPrice: '96400.00',
    stopLoss: '95500.00',
    takeProfit: '96400.00',
    positionSize: '30.00',
    riskAmount: '30.00',
    pnl: '+60.00',
    pnlPercentage: '+2.00',
    rRatio: '2.0',
    result: 'WIN',
    exitReason: 'TP',
    pattern: 'Bullish FVG',
    confidence: '0.80',
    duration: 180, // 3 saat
    openedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    symbol: 'ETHUSDT',
    direction: 'SHORT',
    entryPrice: '3700.00',
    exitPrice: '3730.00',
    stopLoss: '3730.00',
    takeProfit: '3640.00',
    positionSize: '30.00',
    riskAmount: '30.00',
    pnl: '-30.00',
    pnlPercentage: '-1.00',
    rRatio: '-1.0',
    result: 'LOSS',
    exitReason: 'SL',
    pattern: 'Bearish OB',
    confidence: '0.70',
    duration: 45,
    openedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 7 * 60 * 60 * 1000 + 15 * 60 * 1000),
  },
  {
    symbol: 'SOLUSDT',
    direction: 'LONG',
    entryPrice: '242.00',
    exitPrice: '246.00',
    stopLoss: '240.50',
    takeProfit: '246.00',
    positionSize: '30.00',
    riskAmount: '30.00',
    pnl: '+80.00',
    pnlPercentage: '+2.67',
    rRatio: '2.67',
    result: 'WIN',
    exitReason: 'TP',
    pattern: 'SSL + FVG',
    confidence: '0.85',
    duration: 120,
    openedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
];

// Dünkü işlemler (3 adet)
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const yesterdayTrades = [
  {
    symbol: 'BTCUSDT',
    direction: 'LONG',
    entryPrice: '94500.00',
    exitPrice: '95400.00',
    stopLoss: '94200.00',
    takeProfit: '95400.00',
    positionSize: '30.00',
    riskAmount: '30.00',
    pnl: '+90.00',
    pnlPercentage: '+3.00',
    rRatio: '3.0',
    result: 'WIN',
    exitReason: 'TP',
    pattern: 'Triple Confluence',
    confidence: '0.90',
    duration: 240,
    openedAt: new Date(yesterday.getTime() - 8 * 60 * 60 * 1000),
    closedAt: new Date(yesterday.getTime() - 4 * 60 * 60 * 1000),
  },
  {
    symbol: 'ETHUSDT',
    direction: 'LONG',
    entryPrice: '3580.00',
    exitPrice: '3640.00',
    stopLoss: '3560.00',
    takeProfit: '3640.00',
    positionSize: '30.00',
    riskAmount: '30.00',
    pnl: '+90.00',
    pnlPercentage: '+3.00',
    rRatio: '3.0',
    result: 'WIN',
    exitReason: 'TP',
    pattern: 'OB + FVG',
    confidence: '0.85',
    duration: 180,
    openedAt: new Date(yesterday.getTime() - 10 * 60 * 60 * 1000),
    closedAt: new Date(yesterday.getTime() - 7 * 60 * 60 * 1000),
  },
  {
    symbol: 'SOLUSDT',
    direction: 'SHORT',
    entryPrice: '248.00',
    exitPrice: '244.00',
    stopLoss: '249.50',
    takeProfit: '244.00',
    positionSize: '30.00',
    riskAmount: '30.00',
    pnl: '+80.00',
    pnlPercentage: '+2.67',
    rRatio: '2.67',
    result: 'WIN',
    exitReason: 'TP',
    pattern: 'BSL',
    confidence: '0.80',
    duration: 150,
    openedAt: new Date(yesterday.getTime() - 12 * 60 * 60 * 1000),
    closedAt: new Date(yesterday.getTime() - 9 * 60 * 60 * 1000 + 30 * 60 * 1000),
  },
];

const allTrades = [...trades, ...yesterdayTrades];

for (const trade of allTrades) {
  await db.insert(tradeHistory).values({
    symbol: trade.symbol,
    direction: trade.direction,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    positionSize: trade.positionSize,
    riskAmount: trade.riskAmount,
    pnl: trade.pnl,
    pnlPercentage: trade.pnlPercentage,
    rRatio: trade.rRatio,
    result: trade.result,
    exitReason: trade.exitReason,
    pattern: trade.pattern,
    confidence: trade.confidence,
    duration: trade.duration,
    openedAt: trade.openedAt,
    closedAt: trade.closedAt,
  });
}

console.log(`✅ ${allTrades.length} işlem geçmişi oluşturuldu\n`);

// 3. Performans Metrikleri (Son 2 gün)
console.log('📈 Performans metrikleri oluşturuluyor...');

const performanceData = [
  {
    date: formatDate(today),
    startingBalance: '1500.00',
    endingBalance: '1511.67', // +11.67 (bugünkü açık pozisyonlar dahil)
    dailyPnl: '+11.67',
    dailyPnlPercentage: '+0.78',
    totalTrades: 3,
    winningTrades: 2,
    losingTrades: 1,
    winRate: '66.67',
    averageRRatio: '1.22',
    bestTrade: '+80.00',
    worstTrade: '-30.00',
  },
  {
    date: formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
    startingBalance: '1500.00',
    endingBalance: '1560.00',
    dailyPnl: '+60.00',
    dailyPnlPercentage: '+4.00',
    totalTrades: 3,
    winningTrades: 3,
    losingTrades: 0,
    winRate: '100.00',
    averageRRatio: '2.89',
    bestTrade: '+90.00',
    worstTrade: '0.00',
  },
];

for (const perf of performanceData) {
  await db.insert(performanceMetrics).values({
    date: perf.date,
    startingBalance: perf.startingBalance,
    endingBalance: perf.endingBalance,
    dailyPnl: perf.dailyPnl,
    dailyPnlPercentage: perf.dailyPnlPercentage,
    totalTrades: perf.totalTrades,
    winningTrades: perf.winningTrades,
    losingTrades: perf.losingTrades,
    winRate: perf.winRate,
    averageRRatio: perf.averageRRatio,
    bestTrade: perf.bestTrade,
    worstTrade: perf.worstTrade,
  });
}

console.log(`✅ ${performanceData.length} performans metriği oluşturuldu\n`);

// 4. AI Öğrenme Durumu
console.log('🤖 AI öğrenme durumu oluşturuluyor...');

await db.insert(aiLearning).values({
  modelVersion: 'v1.1',
  patternsLearned: 3,
  expertTradesIntegrated: 1,
  lastFineTuneDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  improvements: JSON.stringify({
    patterns: ['Liquidity Sweep', 'Order Block', 'FVG'],
    improvements: [
      'Ana trend takibi eklendi',
      'Giriş zamanlaması iyileştirildi',
      'Risk yönetimi optimize edildi'
    ]
  }),
  performanceBeforeTuning: '78.3',
  performanceAfterTuning: '83.3',
});

console.log('✅ AI öğrenme durumu oluşturuldu\n');

console.log('🎉 Tüm demo verileri başarıyla oluşturuldu!\n');
console.log('📊 Özet:');
console.log(`   - ${openPositions.length} açık pozisyon`);
console.log(`   - ${allTrades.length} işlem geçmişi`);
console.log(`   - ${performanceData.length} performans metriği`);
console.log(`   - 1 AI öğrenme kaydı`);

await connection.end();
