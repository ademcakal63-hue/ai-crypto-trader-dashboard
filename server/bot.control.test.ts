import { describe, it, expect, beforeAll } from 'vitest';
import { toggleBot, getBotSettings } from './settingsDb';
import { checkDailyLossLimit } from './dailyLossControl';

describe('Bot Control System', () => {
  describe('Bot Toggle', () => {
    it('should toggle bot to active', async () => {
      // İlk önce ayarları oluştur
      await getBotSettings();
      
      const result = await toggleBot(true, false);
      
      expect(result.success).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.message).toContain('başlatıldı');
      
      const settings = await getBotSettings();
      expect(settings?.isActive).toBe(true);
    });

    it('should toggle bot to inactive', async () => {
      const result = await toggleBot(false, false);
      
      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false);
      expect(result.message).toContain('durduruldu');
      
      const settings = await getBotSettings();
      expect(settings?.isActive).toBe(false);
    });
  });

  describe('Daily Loss Limit', () => {
    it('should check daily loss limit', async () => {
      const result = await checkDailyLossLimit();
      
      expect(result).toHaveProperty('exceeded');
      expect(result).toHaveProperty('currentLoss');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('percentage');
      
      expect(typeof result.exceeded).toBe('boolean');
      expect(typeof result.currentLoss).toBe('number');
      expect(typeof result.limit).toBe('number');
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.percentage).toBe('number');
    });

    it('should have valid limit values', async () => {
      const result = await checkDailyLossLimit();
      
      expect(result.limit).toBeGreaterThan(0);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.percentage).toBeGreaterThanOrEqual(0);
      expect(result.percentage).toBeLessThanOrEqual(100);
    });
  });
});
