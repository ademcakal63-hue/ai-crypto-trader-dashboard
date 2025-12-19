/**
 * Backtest Engine - Gerçek Binance verileriyle strateji testi
 */

interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

interface BacktestParams {
  symbol: string;
  timeframe: string;
  days: number;
  initialCapital: number;
  riskPerTrade: number;
}

interface Trade {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  direction: 'LONG' | 'SHORT';
  pnl: number;
  pnlPercent: number;
  reason: string;
}

interface BacktestResult {
  equityData: Array<{
    date: string;
    equity: number;
    drawdown: number;
    dailyPnl: number;
  }>;
  trades: Trade[];
  stats: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: string;
    totalPnl: number;
    totalPnlPercent: string;
    maxDrawdown: string;
    sharpeRatio: string;
    profitFactor: string;
    avgWin: string;
    avgLoss: string;
    finalEquity: number;
  };
}

/**
 * Binance'den geçmiş mum verilerini çek
 */
async function fetchHistoricalCandles(
  symbol: string,
  interval: string,
  days: number
): Promise<Candle[]> {
  const endTime = Date.now();
  const startTime = endTime - (days * 24 * 60 * 60 * 1000);
  
  // Binance interval mapping
  const intervalMap: Record<string, any> = {
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
  };
  
  const binanceInterval = intervalMap[interval] || '1h';
  
  try {
    // Use direct fetch for Binance public API
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&startTime=${startTime}&endTime=${endTime}&limit=1000`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map((c: any[]) => ({
      openTime: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
      closeTime: c[6],
    }));
  } catch (error) {
    console.error('Failed to fetch candles:', error);
    throw new Error('Binance veri çekme hatası');
  }
}

/**
 * SMC Pattern Detection (Simplified for backtest)
 */
function detectSMCPatterns(candles: Candle[], index: number): {
  orderBlock: { type: 'bullish' | 'bearish'; price: number } | null;
  fvg: { type: 'bullish' | 'bearish'; high: number; low: number } | null;
  liquiditySweep: { type: 'high' | 'low'; price: number } | null;
  bos: { type: 'bullish' | 'bearish' } | null;
} {
  if (index < 20) return { orderBlock: null, fvg: null, liquiditySweep: null, bos: null };
  
  const current = candles[index];
  const prev = candles[index - 1];
  const prev2 = candles[index - 2];
  
  // Order Block Detection
  let orderBlock = null;
  if (prev.close < prev.open && current.close > current.open && current.close > prev.high) {
    // Bullish OB: Previous bearish candle followed by bullish engulfing
    orderBlock = { type: 'bullish' as const, price: prev.low };
  } else if (prev.close > prev.open && current.close < current.open && current.close < prev.low) {
    // Bearish OB: Previous bullish candle followed by bearish engulfing
    orderBlock = { type: 'bearish' as const, price: prev.high };
  }
  
  // FVG Detection (Fair Value Gap)
  let fvg = null;
  if (index >= 2) {
    if (prev2.high < current.low) {
      // Bullish FVG
      fvg = { type: 'bullish' as const, high: current.low, low: prev2.high };
    } else if (prev2.low > current.high) {
      // Bearish FVG
      fvg = { type: 'bearish' as const, high: prev2.low, low: current.high };
    }
  }
  
  // Liquidity Sweep Detection
  let liquiditySweep = null;
  const recentHighs = candles.slice(Math.max(0, index - 20), index).map(c => c.high);
  const recentLows = candles.slice(Math.max(0, index - 20), index).map(c => c.low);
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  
  if (current.high > highestHigh && current.close < highestHigh) {
    // Swept highs and closed below
    liquiditySweep = { type: 'high' as const, price: highestHigh };
  } else if (current.low < lowestLow && current.close > lowestLow) {
    // Swept lows and closed above
    liquiditySweep = { type: 'low' as const, price: lowestLow };
  }
  
  // BOS Detection (Break of Structure)
  let bos = null;
  const swingHigh = Math.max(...candles.slice(Math.max(0, index - 10), index).map(c => c.high));
  const swingLow = Math.min(...candles.slice(Math.max(0, index - 10), index).map(c => c.low));
  
  if (current.close > swingHigh) {
    bos = { type: 'bullish' as const };
  } else if (current.close < swingLow) {
    bos = { type: 'bearish' as const };
  }
  
  return { orderBlock, fvg, liquiditySweep, bos };
}

/**
 * Calculate ATR for dynamic SL/TP
 */
function calculateATR(candles: Candle[], index: number, period: number = 14): number {
  if (index < period) return candles[index].high - candles[index].low;
  
  let atrSum = 0;
  for (let i = index - period + 1; i <= index; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1]?.close || candles[i].open;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    atrSum += tr;
  }
  
  return atrSum / period;
}

/**
 * Run backtest with SMC strategy
 */
export async function runBacktest(params: BacktestParams): Promise<BacktestResult> {
  const { symbol, timeframe, days, initialCapital, riskPerTrade } = params;
  
  // Fetch historical data
  const candles = await fetchHistoricalCandles(symbol, timeframe, days);
  
  if (candles.length < 50) {
    throw new Error('Yeterli veri yok. Daha kısa bir süre deneyin.');
  }
  
  let equity = initialCapital;
  let maxEquity = equity;
  const trades: Trade[] = [];
  const equityData: Array<{ date: string; equity: number; drawdown: number; dailyPnl: number }> = [];
  
  let inPosition = false;
  let positionDirection: 'LONG' | 'SHORT' | null = null;
  let entryPrice = 0;
  let entryTime = 0;
  let stopLoss = 0;
  let takeProfit = 0;
  let positionSize = 0;
  
  let currentDay = '';
  let dailyPnl = 0;
  
  // Iterate through candles
  for (let i = 50; i < candles.length; i++) {
    const candle = candles[i];
    const candleDate = new Date(candle.openTime).toISOString().split('T')[0];
    
    // Track daily P&L
    if (candleDate !== currentDay) {
      if (currentDay !== '') {
        const drawdown = ((maxEquity - equity) / maxEquity) * 100;
        equityData.push({
          date: currentDay,
          equity: Math.round(equity * 100) / 100,
          drawdown: Math.round(drawdown * 100) / 100,
          dailyPnl: Math.round(dailyPnl * 100) / 100,
        });
      }
      currentDay = candleDate;
      dailyPnl = 0;
    }
    
    // Check if in position
    if (inPosition) {
      // Check stop loss
      if (positionDirection === 'LONG' && candle.low <= stopLoss) {
        const pnl = (stopLoss - entryPrice) / entryPrice * positionSize;
        equity += pnl;
        dailyPnl += pnl;
        trades.push({
          entryTime,
          exitTime: candle.openTime,
          entryPrice,
          exitPrice: stopLoss,
          direction: 'LONG',
          pnl,
          pnlPercent: (pnl / positionSize) * 100,
          reason: 'Stop Loss',
        });
        inPosition = false;
        positionDirection = null;
      } else if (positionDirection === 'SHORT' && candle.high >= stopLoss) {
        const pnl = (entryPrice - stopLoss) / entryPrice * positionSize;
        equity += pnl;
        dailyPnl += pnl;
        trades.push({
          entryTime,
          exitTime: candle.openTime,
          entryPrice,
          exitPrice: stopLoss,
          direction: 'SHORT',
          pnl,
          pnlPercent: (pnl / positionSize) * 100,
          reason: 'Stop Loss',
        });
        inPosition = false;
        positionDirection = null;
      }
      // Check take profit
      else if (positionDirection === 'LONG' && candle.high >= takeProfit) {
        const pnl = (takeProfit - entryPrice) / entryPrice * positionSize;
        equity += pnl;
        dailyPnl += pnl;
        trades.push({
          entryTime,
          exitTime: candle.openTime,
          entryPrice,
          exitPrice: takeProfit,
          direction: 'LONG',
          pnl,
          pnlPercent: (pnl / positionSize) * 100,
          reason: 'Take Profit',
        });
        inPosition = false;
        positionDirection = null;
      } else if (positionDirection === 'SHORT' && candle.low <= takeProfit) {
        const pnl = (entryPrice - takeProfit) / entryPrice * positionSize;
        equity += pnl;
        dailyPnl += pnl;
        trades.push({
          entryTime,
          exitTime: candle.openTime,
          entryPrice,
          exitPrice: takeProfit,
          direction: 'SHORT',
          pnl,
          pnlPercent: (pnl / positionSize) * 100,
          reason: 'Take Profit',
        });
        inPosition = false;
        positionDirection = null;
      }
    }
    
    // Look for entry signals (only if not in position)
    if (!inPosition) {
      const patterns = detectSMCPatterns(candles, i);
      const atr = calculateATR(candles, i);
      
      // Entry conditions
      let shouldEnterLong = false;
      let shouldEnterShort = false;
      let entryReason = '';
      
      // Bullish entry: OB + BOS or Liquidity Sweep Low
      if (patterns.orderBlock?.type === 'bullish' && patterns.bos?.type === 'bullish') {
        shouldEnterLong = true;
        entryReason = 'Bullish OB + BOS';
      } else if (patterns.liquiditySweep?.type === 'low' && patterns.bos?.type === 'bullish') {
        shouldEnterLong = true;
        entryReason = 'Liquidity Sweep Low + BOS';
      } else if (patterns.fvg?.type === 'bullish' && patterns.bos?.type === 'bullish') {
        shouldEnterLong = true;
        entryReason = 'Bullish FVG + BOS';
      }
      
      // Bearish entry: OB + BOS or Liquidity Sweep High
      if (patterns.orderBlock?.type === 'bearish' && patterns.bos?.type === 'bearish') {
        shouldEnterShort = true;
        entryReason = 'Bearish OB + BOS';
      } else if (patterns.liquiditySweep?.type === 'high' && patterns.bos?.type === 'bearish') {
        shouldEnterShort = true;
        entryReason = 'Liquidity Sweep High + BOS';
      } else if (patterns.fvg?.type === 'bearish' && patterns.bos?.type === 'bearish') {
        shouldEnterShort = true;
        entryReason = 'Bearish FVG + BOS';
      }
      
      // Execute entry
      if (shouldEnterLong) {
        entryPrice = candle.close;
        entryTime = candle.openTime;
        stopLoss = entryPrice - (atr * 1.5);
        takeProfit = entryPrice + (atr * 3); // 2:1 R:R
        
        // Calculate position size based on risk
        const riskAmount = equity * (riskPerTrade / 100);
        const slDistance = entryPrice - stopLoss;
        positionSize = (riskAmount / slDistance) * entryPrice;
        
        inPosition = true;
        positionDirection = 'LONG';
      } else if (shouldEnterShort) {
        entryPrice = candle.close;
        entryTime = candle.openTime;
        stopLoss = entryPrice + (atr * 1.5);
        takeProfit = entryPrice - (atr * 3); // 2:1 R:R
        
        // Calculate position size based on risk
        const riskAmount = equity * (riskPerTrade / 100);
        const slDistance = stopLoss - entryPrice;
        positionSize = (riskAmount / slDistance) * entryPrice;
        
        inPosition = true;
        positionDirection = 'SHORT';
      }
    }
    
    // Update max equity
    maxEquity = Math.max(maxEquity, equity);
  }
  
  // Add final day
  if (currentDay !== '') {
    const drawdown = ((maxEquity - equity) / maxEquity) * 100;
    equityData.push({
      date: currentDay,
      equity: Math.round(equity * 100) / 100,
      drawdown: Math.round(drawdown * 100) / 100,
      dailyPnl: Math.round(dailyPnl * 100) / 100,
    });
  }
  
  // Calculate stats
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl <= 0).length;
  const totalPnl = equity - initialCapital;
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
    : 0;
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
    : 0;
  const profitFactor = avgLoss > 0 ? (avgWin * wins) / (avgLoss * losses) : 0;
  
  // Calculate Sharpe Ratio (simplified)
  const returns = equityData.map((d, i) => i > 0 ? (d.equity - equityData[i-1].equity) / equityData[i-1].equity : 0);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  
  return {
    equityData,
    trades,
    stats: {
      totalTrades: trades.length,
      wins,
      losses,
      winRate: trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : '0.0',
      totalPnl: Math.round(totalPnl * 100) / 100,
      totalPnlPercent: ((totalPnl / initialCapital) * 100).toFixed(2),
      maxDrawdown: equityData.length > 0 ? Math.max(...equityData.map(d => d.drawdown)).toFixed(2) : '0.00',
      sharpeRatio: sharpeRatio.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      finalEquity: Math.round(equity * 100) / 100,
    },
  };
}
