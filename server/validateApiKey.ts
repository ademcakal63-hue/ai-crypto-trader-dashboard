import { getBinanceClient, getFuturesBalance } from "./binance";

/**
 * Binance Futures API Key'i doğrula
 */
export async function validateBinanceApiKey(apiKey: string, apiSecret: string): Promise<{
  valid: boolean;
  message: string;
  balance?: { total: number; available: number };
}> {
  try {
    const client = getBinanceClient(apiKey, apiSecret);
    
    // Futures API key'i test et - Futures hesap bilgilerini çek
    const balance = await getFuturesBalance(client);
    
    const total = balance.total;
    const available = balance.available;
    
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
      message = 'API Key yetkisi yetersiz. "Enable Futures" yetkisi verin.';
    } else if (error.message?.includes('Futures')) {
      message = 'Futures API erişimi yok. "Enable Futures" yetkisini aktif edin.';
    }
    
    return {
      valid: false,
      message,
    };
  }
}
