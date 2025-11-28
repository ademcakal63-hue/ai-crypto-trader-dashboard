import { getBinanceClient } from "./binance";
import { getBotSettings } from "./settingsDb";

/**
 * Binance hesap bakiyesini getir
 */
export async function getBinanceBalance() {
  const settings = await getBotSettings();
  
  if (!settings?.binanceApiKey || !settings?.binanceApiSecret || !settings?.isConnected) {
    return null; // Hesap bağlı değil
  }

  try {
    const client = getBinanceClient(settings.binanceApiKey, settings.binanceApiSecret);
    // @ts-ignore - binance-api-node tip tanımları eksik
    const accountInfo = await client.accountInformation();
    
    // USDT bakiyesini bul
    const usdtBalance = accountInfo.balances.find((b: any) => b.asset === 'USDT');
    
    if (!usdtBalance) {
      return { total: '0.00', available: '0.00' };
    }
    
    return {
      total: parseFloat(usdtBalance.free) + parseFloat(usdtBalance.locked),
      available: parseFloat(usdtBalance.free),
    };
  } catch (error) {
    console.error('Binance balance error:', error);
    return null;
  }
}
