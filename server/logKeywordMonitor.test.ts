import { describe, it, expect, beforeEach } from 'vitest';
import { detectKeywords, clearThrottle } from './logKeywordMonitor';

describe('Log Keyword Monitor', () => {
  beforeEach(() => {
    clearThrottle();
  });

  it('should detect ERROR keywords', () => {
    const result = detectKeywords('[2024-01-01] ERROR: Connection failed');
    expect(result.detected).toBe(true);
    expect(result.category).toBe('ERROR');
    expect(result.keyword).toBe('ERROR');
  });

  it('should detect TRADE keywords', () => {
    const result = detectKeywords('[2024-01-01] POSITION_OPENED: BTCUSDT LONG at $45000');
    expect(result.detected).toBe(true);
    expect(result.category).toBe('TRADE');
    expect(result.keyword).toBe('POSITION_OPENED');
  });

  it('should detect SUCCESS keywords', () => {
    const result = detectKeywords('[2024-01-01] Trade completed successfully with PROFIT');
    expect(result.detected).toBe(true);
    expect(result.category).toBe('SUCCESS');
    expect(result.keyword).toBe('SUCCESS'); // SUCCESS is detected first
  });

  it('should detect WARNING keywords', () => {
    const result = detectKeywords('[2024-01-01] WARNING: High volatility detected');
    expect(result.detected).toBe(true);
    expect(result.category).toBe('WARNING');
    expect(result.keyword).toBe('WARNING');
  });

  it('should not detect keywords in normal logs', () => {
    const result = detectKeywords('[2024-01-01] Bot is running normally');
    expect(result.detected).toBe(false);
    expect(result.category).toBeUndefined();
  });

  it('should be case insensitive', () => {
    const result1 = detectKeywords('error occurred');
    expect(result1.detected).toBe(true);
    
    const result2 = detectKeywords('Error Occurred');
    expect(result2.detected).toBe(true);
    
    const result3 = detectKeywords('ERROR OCCURRED');
    expect(result3.detected).toBe(true);
  });

  it('should detect multiple keywords and return first match', () => {
    const result = detectKeywords('FAILED to execute TRADE');
    expect(result.detected).toBe(true);
    // Should detect FAILED first (ERROR category)
    expect(result.category).toBe('ERROR');
  });
});
