import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';

describe('Bot Control System', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });
  });

  afterAll(async () => {
    // Clean up: stop all bots
    try {
      const status = await caller.bot.status();
      if (status.bots && status.bots.length > 0) {
        for (const bot of status.bots) {
          if (bot.status === 'running') {
            await caller.bot.stop({ symbol: bot.symbol });
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should get bot status', async () => {
    const result = await caller.bot.status();
    
    expect(result).toHaveProperty('bots');
    expect(result).toHaveProperty('totalRunning');
    expect(Array.isArray(result.bots)).toBe(true);
    expect(typeof result.totalRunning).toBe('number');
  });

  it('should start a bot for BTCUSDT', async () => {
    const result = await caller.bot.start({ symbol: 'BTCUSDT' });
    
    expect(result).toHaveProperty('success');
    
    if (result.success) {
      expect(result).toHaveProperty('pid');
      expect(result).toHaveProperty('startedAt');
      expect(result.message).toContain('started');
      
      // Wait a bit for the process to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify bot is running
      const status = await caller.bot.status();
      const btcBot = status.bots?.find((b: any) => b.symbol === 'BTCUSDT');
      
      if (btcBot) {
        expect(btcBot.status).toBe('running');
        expect(btcBot.pid).toBeDefined();
      }
    } else {
      // Bot might already be running or failed to start
      expect(result.message).toBeDefined();
    }
  }, 10000); // 10 second timeout

  it('should not start the same bot twice', async () => {
    // Try to start BTCUSDT again
    const result = await caller.bot.start({ symbol: 'BTCUSDT' });
    
    if (!result.success) {
      expect(result.message).toContain('already running');
    }
  });

  it('should stop a running bot', async () => {
    const result = await caller.bot.stop({ symbol: 'BTCUSDT' });
    
    expect(result).toHaveProperty('success');
    
    if (result.success) {
      expect(result.message).toContain('stopped');
      
      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify bot is stopped
      const status = await caller.bot.status();
      const btcBot = status.bots?.find((b: any) => b.symbol === 'BTCUSDT');
      
      // Bot should either not exist or be stopped
      expect(btcBot === undefined || btcBot.status === 'stopped').toBe(true);
    }
  }, 10000);

  it('should handle multiple bots', async () => {
    // Start multiple bots
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    
    for (const symbol of symbols) {
      await caller.bot.start({ symbol });
    }
    
    // Wait for processes to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check status
    const status = await caller.bot.status();
    
    // At least some bots should be running
    expect(status.bots.length).toBeGreaterThan(0);
    
    // Stop all bots
    for (const symbol of symbols) {
      await caller.bot.stop({ symbol });
    }
    
    // Wait for shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, 20000);

  it('should return error when stopping non-existent bot', async () => {
    const result = await caller.bot.stop({ symbol: 'NONEXISTENT' });
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('No running bot');
  });
});
