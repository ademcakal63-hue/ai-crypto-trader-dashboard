import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

function createTestContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };

  return ctx;
}

describe('Settings API Connection Fix', () => {
  it('should have validateApiKey mutation in settings router', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.settings.validateApiKey).toBeDefined();
  });

  it('should have update mutation in settings router', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.settings.update).toBeDefined();
  });

  it('should have get query in settings router', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.settings.get).toBeDefined();
  });

  it('should have binance.balance query', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.binance.balance).toBeDefined();
  });

  it('validateApiKey should return valid structure on invalid keys', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.settings.validateApiKey({
      apiKey: 'invalid_key',
      apiSecret: 'invalid_secret',
    });

    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('message');
    expect(result.valid).toBe(false);
  });

  it('binance.balance should return null when not connected', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.binance.balance();
    expect(result).toHaveProperty('balance');
    // Should be null when no API keys are configured
    expect(result.balance).toBeNull();
  });

  it('settings.get should return default settings', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.settings.get();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('useAllBalance');
    expect(result).toHaveProperty('compoundEnabled');
    expect(result).toHaveProperty('dailyLossLimitPercent');
    expect(result).toHaveProperty('riskPerTradePercent');
  });
});
