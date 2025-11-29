import Binance from 'binance-api-node';

/**
 * Binance Testnet Client
 * Gerçek piyasa verileri, sanal para (risk yok)
 */

// Testnet için API credentials (public testnet, herkes kullanabilir)
// Gerçek API key eklemek için .env'e BINANCE_API_KEY ve BINANCE_API_SECRET ekle
const TESTNET_BASE_URL = 'https://testnet.binance.vision';

// @ts-ignore - Binance default export
const BinanceConstructor = Binance.default || Binance;

export const binanceClient = BinanceConstructor({
  apiKey: process.env.BINANCE_API_KEY || '',
  apiSecret: process.env.BINANCE_API_SECRET || '',
  httpBase: TESTNET_BASE_URL,
  wsBase: 'wss://testnet.binance.vision/ws',
  // Testnet için getTime override (zaman senkronizasyonu)
  getTime: () => Date.now(),
});

/**
 * Özel API key ile Binance client oluştur
 */
export function getBinanceClient(apiKey: string, apiSecret: string) {
  return BinanceConstructor({
    apiKey,
    apiSecret,
    httpBase: TESTNET_BASE_URL,
    wsBase: 'wss://testnet.binance.vision/ws',
    getTime: () => Date.now(),
  });
}

/**
 * Gerçek zamanlı fiyat çekme
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    // @ts-ignore - binance-api-node tip tanımları eksik
    const ticker = await binanceClient.prices({ symbol });
    return parseFloat(ticker[symbol] || '0');
  } catch (error) {
    console.error(`[Binance] Fiyat çekme hatası (${symbol}):`, error);
    throw error;
  }
}

/**
 * Birden fazla coin için fiyat çekme
 */
export async function getAllPrices(): Promise<Record<string, number>> {
  try {
    // @ts-ignore - binance-api-node tip tanımları eksik
    const prices = await binanceClient.prices();
    const parsed: Record<string, number> = {};
    
    for (const [symbol, price] of Object.entries(prices)) {
      parsed[symbol] = parseFloat(price as string);
    }
    
    return parsed;
  } catch (error) {
    console.error('[Binance] Toplu fiyat çekme hatası:', error);
    throw error;
  }
}

/**
 * 24 saatlik istatistikler
 */
export async function get24hrStats(symbol: string) {
  try {
    // @ts-ignore - binance-api-node tip tanımları eksik
    return await binanceClient.dailyStats({ symbol });
  } catch (error) {
    console.error(`[Binance] 24hr stats hatası (${symbol}):`, error);
    throw error;
  }
}

/**
 * Kline/Candlestick verileri (OHLCV)
 */
export async function getKlines(
  symbol: string,
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '15m',
  limit: number = 100
) {
  try {
    // @ts-ignore - binance-api-node tip tanımları eksik
    const klines = await binanceClient.candles({
      symbol,
      interval,
      limit,
    });
    
    // @ts-ignore
    return klines.map((k: any) => ({
      openTime: k.openTime,
      open: parseFloat(k.open),
      high: parseFloat(k.high),
      low: parseFloat(k.low),
      close: parseFloat(k.close),
      volume: parseFloat(k.volume),
      closeTime: k.closeTime,
    }));
  } catch (error) {
    console.error(`[Binance] Kline çekme hatası (${symbol}):`, error);
    throw error;
  }
}

/**
 * WebSocket ile gerçek zamanlı fiyat takibi
 * (Frontend'de kullanılacak)
 */
export function subscribeToPriceUpdates(
  symbol: string,
  callback: (price: number) => void
) {
  // @ts-ignore - binance-api-node tip tanımları eksik
  const clean = binanceClient.ws.ticker(symbol, (ticker: any) => {
    callback(parseFloat(ticker.curDayClose));
  });
  
  return clean; // Cleanup fonksiyonu döndür
}

/**
 * Desteklenen trading pair'leri
 */
export const SUPPORTED_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
] as const;

export type SupportedPair = typeof SUPPORTED_PAIRS[number];
