import { getBinanceClient } from "./binance";

/**
 * Binance API Key'i doğrula
 */
export async function validateBinanceApiKey(apiKey: string, apiSecret: string): Promise<{
  valid: boolean;
  message: string;
  balance?: { total: number; available: number };
}> {
  try {
    const client = getBinanceClient(apiKey, apiSecret);
    
    // API key'i test et - hesap bilgilerini çek
    // @ts-ignore - binance-api-node tip tanımları eksik
    const accountInfo = await client.accountInformation();
    
    // USDT bakiyesini bul
    const usdtBalance = accountInfo.balances.find((b: any) => b.asset === 'USDT');
    
    const total = usdtBalance 
      ? parseFloat(usdtBalance.free) + parseFloat(usdtBalance.locked)
      : 0;
    const available = usdtBalance ? parseFloat(usdtBalance.free) : 0;
    
    return {
      valid: true,
      message: 'Bağlantı başarılı! Hesap bilgileri alındı.',
      balance: { total, available },
    };
  } catch (error: any) {
    console.error('Binance API validation error:', error);
    
    // Hata mesajını kullanıcı dostu hale getir
    let message = 'API Key doğrulama başarısız.';
    
    if (error.message?.includes('Invalid API-key')) {
      message = 'Geçersiz API Key. Lütfen kontrol edin.';
    } else if (error.message?.includes('Signature')) {
      message = 'Geçersiz API Secret. Lütfen kontrol edin.';
    } else if (error.message?.includes('IP')) {
      message = 'IP kısıtlaması var. Binance\'de IP ayarlarını kontrol edin.';
    } else if (error.message?.includes('permission')) {
      message = 'API Key yetkisi yetersiz. Spot Trading yetkisi verin.';
    }
    
    return {
      valid: false,
      message,
    };
  }
}
