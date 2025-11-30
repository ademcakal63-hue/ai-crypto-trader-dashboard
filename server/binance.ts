import Binance from 'binance-api-node';

/**
 * Binance Futures API Client
 * Gerçek hesap için Mainnet, test için Testnet
 */

// Environment'a göre Testnet veya Mainnet kullan
const USE_TESTNET = process.env.BINANCE_USE_TESTNET === 'true';
const API_BASE_URL = USE_TESTNET 
  ? 'https://testnet.binance.vision'
  : 'https://api.binance.com';
const WS_BASE_URL = USE_TESTNET
  ? 'wss://testnet.binance.vision/ws'
  : 'wss://stream.binance.com:9443/ws';

// @ts-ignore - Binance default export
const BinanceConstructor = Binance.default || Binance;

export const binanceClient = BinanceConstructor({
  apiKey: process.env.BINANCE_API_KEY || '',
  apiSecret: process.env.BINANCE_API_SECRET || '',
  httpBase: API_BASE_URL,
  wsBase: WS_BASE_URL,
  getTime: () => Date.now(),
});

/**
 * Özel API key ile Binance client oluştur
 */
export function getBinanceClient(apiKey: string, apiSecret: string) {
  return BinanceConstructor({
    apiKey,
    apiSecret,
    httpBase: API_BASE_URL,
    wsBase: WS_BASE_URL,
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

/**
 * ==========================================
 * FUTURES API FUNCTIONS
 * ==========================================
 */

/**
 * Futures hesap bilgilerini getir
 */
export async function getFuturesAccountInfo(client: any = binanceClient) {
  try {
    // @ts-ignore - binance-api-node tip tanımları eksik
    const accountInfo = await client.futuresAccountInfo();
    return accountInfo;
  } catch (error) {
    console.error('[Binance Futures] Account info hatası:', error);
    throw error;
  }
}

/**
 * Futures USDT bakiyesini getir
 */
export async function getFuturesBalance(client: any = binanceClient) {
  try {
    const accountInfo = await getFuturesAccountInfo(client);
    
    // USDT bakiyesini bul
    const usdtAsset = accountInfo.assets?.find((a: any) => a.asset === 'USDT');
    
    if (!usdtAsset) {
      return { total: 0, available: 0 };
    }
    
    return {
      total: parseFloat(usdtAsset.walletBalance || '0'),
      available: parseFloat(usdtAsset.availableBalance || '0'),
    };
  } catch (error) {
    console.error('[Binance Futures] Balance hatası:', error);
    throw error;
  }
}

/**
 * Futures pozisyonlarını getir
 */
export async function getFuturesPositions(client: any = binanceClient) {
  try {
    // @ts-ignore
    const positions = await client.futuresPositionRisk();
    
    // Sadece açık pozisyonları filtrele
    return positions.filter((p: any) => parseFloat(p.positionAmt) !== 0);
  } catch (error) {
    console.error('[Binance Futures] Positions hatası:', error);
    throw error;
  }
}

/**
 * Kaldıraç ayarla
 */
export async function setLeverage(
  symbol: string,
  leverage: number,
  client: any = binanceClient
) {
  try {
    // @ts-ignore
    const result = await client.futuresLeverage({
      symbol,
      leverage,
    });
    
    console.log(`[Binance Futures] Kaldıraç ayarlandı: ${symbol} → ${leverage}x`);
    return result;
  } catch (error) {
    console.error(`[Binance Futures] Kaldıraç ayarlama hatası (${symbol}):`, error);
    throw error;
  }
}

/**
 * Futures market order (pozisyon aç/kapat)
 */
export async function futuresMarketOrder(
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
  client: any = binanceClient
) {
  try {
    // @ts-ignore
    const order = await client.futuresOrder({
      symbol,
      side,
      type: 'MARKET',
      quantity: quantity.toString(),
    });
    
    console.log(`[Binance Futures] Market order: ${side} ${quantity} ${symbol}`);
    return order;
  } catch (error) {
    console.error(`[Binance Futures] Market order hatası (${symbol}):`, error);
    throw error;
  }
}

/**
 * Futures limit order (stop loss / take profit)
 */
export async function futuresLimitOrder(
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
  price: number,
  client: any = binanceClient
) {
  try {
    // @ts-ignore
    const order = await client.futuresOrder({
      symbol,
      side,
      type: 'LIMIT',
      quantity: quantity.toString(),
      price: price.toString(),
      timeInForce: 'GTC', // Good Till Cancel
    });
    
    console.log(`[Binance Futures] Limit order: ${side} ${quantity} ${symbol} @ ${price}`);
    return order;
  } catch (error) {
    console.error(`[Binance Futures] Limit order hatası (${symbol}):`, error);
    throw error;
  }
}

/**
 * Stop Loss order
 */
export async function futuresStopLoss(
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
  stopPrice: number,
  client: any = binanceClient
) {
  try {
    // @ts-ignore
    const order = await client.futuresOrder({
      symbol,
      side,
      type: 'STOP_MARKET',
      quantity: quantity.toString(),
      stopPrice: stopPrice.toString(),
    });
    
    console.log(`[Binance Futures] Stop Loss: ${side} ${quantity} ${symbol} @ ${stopPrice}`);
    return order;
  } catch (error) {
    console.error(`[Binance Futures] Stop Loss hatası (${symbol}):`, error);
    throw error;
  }
}

/**
 * Take Profit order
 */
export async function futuresTakeProfit(
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
  takeProfitPrice: number,
  client: any = binanceClient
) {
  try {
    // @ts-ignore
    const order = await client.futuresOrder({
      symbol,
      side,
      type: 'TAKE_PROFIT_MARKET',
      quantity: quantity.toString(),
      stopPrice: takeProfitPrice.toString(),
    });
    
    console.log(`[Binance Futures] Take Profit: ${side} ${quantity} ${symbol} @ ${takeProfitPrice}`);
    return order;
  } catch (error) {
    console.error(`[Binance Futures] Take Profit hatası (${symbol}):`, error);
    throw error;
  }
}

/**
 * Tüm açık pozisyonları kapat (Emergency Stop)
 */
export async function closeAllPositions(client: any = binanceClient) {
  try {
    const positions = await getFuturesPositions(client);
    
    if (positions.length === 0) {
      console.log('[Binance Futures] Kapatılacak pozisyon yok');
      return [];
    }
    
    const closedPositions = [];
    
    for (const position of positions) {
      const positionAmt = Math.abs(parseFloat(position.positionAmt));
      const side = parseFloat(position.positionAmt) > 0 ? 'SELL' : 'BUY'; // Ters yönde kapat
      
      try {
        const order = await futuresMarketOrder(
          position.symbol,
          side,
          positionAmt,
          client
        );
        
        closedPositions.push({
          symbol: position.symbol,
          quantity: positionAmt,
          side,
          order,
        });
        
        console.log(`[Binance Futures] Pozisyon kapatıldı: ${position.symbol}`);
      } catch (error) {
        console.error(`[Binance Futures] Pozisyon kapatma hatası (${position.symbol}):`, error);
      }
    }
    
    return closedPositions;
  } catch (error) {
    console.error('[Binance Futures] Tüm pozisyonları kapatma hatası:', error);
    throw error;
  }
}

/**
 * Pozisyon büyüklüğünü hesapla (quantity)
 * 
 * @param symbol Trading pair (BTCUSDT, ETHUSDT, etc.)
 * @param positionSizeUSDT Pozisyon büyüklüğü USDT cinsinden
 * @param currentPrice Güncel fiyat
 * @returns Quantity (coin miktarı)
 */
export function calculateQuantity(
  symbol: string,
  positionSizeUSDT: number,
  currentPrice: number
): number {
  // Quantity = Position Size / Price
  const quantity = positionSizeUSDT / currentPrice;
  
  // Binance precision'a göre yuvarla (genellikle 3 decimal)
  return parseFloat(quantity.toFixed(3));
}
