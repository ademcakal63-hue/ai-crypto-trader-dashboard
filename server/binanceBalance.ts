import { getBinanceClient, getFuturesBalance } from "./binance";
import { getBotSettings } from "./settingsDb";

/**
 * Binance Futures hesap bakiyesini getir
 */
export async function getBinanceBalance() {
  const settings = await getBotSettings();
  
  if (!settings?.binanceApiKey || !settings?.binanceApiSecret || !settings?.isConnected) {
    return null; // Hesap bağlı değil
  }

  try {
    const client = getBinanceClient(settings.binanceApiKey, settings.binanceApiSecret);
    
    // Futures bakiyesini çek
    const balance = await getFuturesBalance(client);
    
    return {
      total: balance.total,
      available: balance.available,
    };
  } catch (error) {
    console.error('Binance Futures balance error:', error);
    return null;
  }
}
