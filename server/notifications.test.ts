import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';

describe('Notification System', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });
  });

  it('should list notifications', async () => {
    const result = await caller.notifications.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should get unread notifications', async () => {
    const result = await caller.notifications.unread();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should create notification via bot API', async () => {
    const result = await caller.bot.notification({
      type: 'COST_WARNING',
      title: 'Test Notification',
      message: 'This is a test notification',
      severity: 'INFO',
    });
    
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });

  it('should mark notification as read', async () => {
    // First create a notification
    await caller.bot.notification({
      type: 'POSITION_OPENED',
      title: 'Test for Mark Read',
      message: 'Testing mark as read functionality',
      severity: 'INFO',
    });

    // Get all notifications
    const notifications = await caller.notifications.list();
    expect(notifications.length).toBeGreaterThan(0);

    // Mark the first one as read
    const firstNotification = notifications[0];
    const result = await caller.notifications.markAsRead({ id: firstNotification.id });
    
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    // Create multiple notifications
    await caller.bot.notification({
      type: 'POSITION_OPENED',
      title: 'Test 1',
      message: 'Test message 1',
      severity: 'INFO',
    });
    
    await caller.bot.notification({
      type: 'RISK_LIMIT_WARNING',
      title: 'Test 2',
      message: 'Test message 2',
      severity: 'WARNING',
    });

    // Mark all as read
    const result = await caller.notifications.markAllAsRead();
    
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);

    // Verify all are read
    const unread = await caller.notifications.unread();
    expect(unread.length).toBe(0);
  });

  it('should handle different notification severities', async () => {
    const testCases = [
      { type: 'POSITION_OPENED', severity: 'INFO' },
      { type: 'RISK_LIMIT_WARNING', severity: 'WARNING' },
      { type: 'EMERGENCY_STOP', severity: 'ERROR' },
      { type: 'FINETUNING_SUCCESS', severity: 'SUCCESS' },
    ];
    
    for (const testCase of testCases) {
      const result = await caller.bot.notification({
        type: testCase.type,
        title: `Test ${testCase.severity}`,
        message: `Testing ${testCase.severity} severity`,
        severity: testCase.severity as any,
      });
      
      expect(result.success).toBe(true);
    }

    const notifications = await caller.notifications.list();
    const recentNotifications = notifications.slice(0, 4);
    
    expect(recentNotifications.some(n => n.severity === 'INFO')).toBe(true);
    expect(recentNotifications.some(n => n.severity === 'WARNING')).toBe(true);
    expect(recentNotifications.some(n => n.severity === 'ERROR')).toBe(true);
    expect(recentNotifications.some(n => n.severity === 'SUCCESS')).toBe(true);
  });
});
