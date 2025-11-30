import { describe, it, expect, beforeEach } from 'vitest';
import { getDb } from './db';
import { botSettings } from '../drizzle/schema';
import { getBotSettings, updateBotSettings } from './settingsDb';

describe('Settings Balance Sync', () => {
  beforeEach(async () => {
    // Test öncesi settings tablosunu temizle
    const db = await getDb();
    if (db) {
      await db.delete(botSettings);
    }
  });

  it('should create default settings with useAllBalance=true', async () => {
    const settings = await getBotSettings();
    
    expect(settings).toBeDefined();
    expect(settings?.useAllBalance).toBe(true);
    expect(settings?.capitalLimit).toBeNull();
    expect(settings?.compoundEnabled).toBe(false);
    expect(settings?.dailyLossLimitPercent).toBe('4.00');
    expect(settings?.riskPerTradePercent).toBe('2.00');
  });

  it('should update capitalLimit when useAllBalance is false', async () => {
    // İlk ayarları oluştur
    await getBotSettings();
    
    // Sermaye limiti belirle
    await updateBotSettings({
      useAllBalance: false,
      capitalLimit: '500',
    });
    
    const updated = await getBotSettings();
    expect(updated?.useAllBalance).toBe(false);
    expect(updated?.capitalLimit).toBe('500');
  });

  it('should allow null capitalLimit when useAllBalance is true', async () => {
    // İlk ayarları oluştur
    await getBotSettings();
    
    // Tüm bakiyeyi kullan moduna geç
    await updateBotSettings({
      useAllBalance: true,
      capitalLimit: null,
    });
    
    const updated = await getBotSettings();
    expect(updated?.useAllBalance).toBe(true);
    expect(updated?.capitalLimit).toBeNull();
  });

  it('should update compound settings', async () => {
    // İlk ayarları oluştur
    await getBotSettings();
    
    // Bileşik getiri aktif et
    await updateBotSettings({
      compoundEnabled: true,
    });
    
    const updated = await getBotSettings();
    expect(updated?.compoundEnabled).toBe(true);
  });

  it('should update risk parameters', async () => {
    // İlk ayarları oluştur
    await getBotSettings();
    
    // Risk parametrelerini güncelle
    await updateBotSettings({
      dailyLossLimitPercent: '5.00',
      riskPerTradePercent: '1.50',
      maxDailyTrades: 15,
    });
    
    const updated = await getBotSettings();
    expect(updated?.dailyLossLimitPercent).toBe('5.00');
    expect(updated?.riskPerTradePercent).toBe('1.50');
    expect(updated?.maxDailyTrades).toBe(15);
  });

  it('should handle API key updates', async () => {
    // İlk ayarları oluştur
    await getBotSettings();
    
    // API key'leri güncelle
    await updateBotSettings({
      binanceApiKey: 'test_api_key',
      binanceApiSecret: 'test_api_secret',
      isConnected: true,
    });
    
    const updated = await getBotSettings();
    expect(updated?.binanceApiKey).toBe('test_api_key');
    expect(updated?.binanceApiSecret).toBe('test_api_secret');
    expect(updated?.isConnected).toBe(true);
  });

  it('should maintain default values when not specified', async () => {
    // İlk ayarları oluştur
    await getBotSettings();
    
    // Sadece bir değeri güncelle
    await updateBotSettings({
      capitalLimit: '1000',
    });
    
    const updated = await getBotSettings();
    // Diğer değerler korunmalı
    expect(updated?.dailyLossLimitPercent).toBe('4.00');
    expect(updated?.riskPerTradePercent).toBe('2.00');
    expect(updated?.maxDailyTrades).toBe(10);
    expect(updated?.compoundEnabled).toBe(false);
  });
});
