import { createNotification } from './notificationService';

// Keywords to monitor
const KEYWORDS = {
  ERROR: {
    keywords: ['ERROR', 'FAILED', 'EXCEPTION', 'CRASH'],
    notificationType: 'BOT_ERROR' as const,
    priority: 'high' as const,
  },
  TRADE: {
    keywords: ['POSITION_OPENED', 'POSITION_CLOSED', 'TRADE_EXECUTED', 'ORDER_FILLED'],
    notificationType: 'TRADE_EXECUTED' as const,
    priority: 'normal' as const,
  },
  SUCCESS: {
    keywords: ['SUCCESS', 'COMPLETED', 'PROFIT'],
    notificationType: 'TRADE_SUCCESS' as const,
    priority: 'low' as const,
  },
  WARNING: {
    keywords: ['WARNING', 'WARN', 'RISK'],
    notificationType: 'BOT_WARNING' as const,
    priority: 'normal' as const,
  },
};

// Throttle map to prevent spam (symbol -> last notification time)
const throttleMap = new Map<string, number>();
const THROTTLE_INTERVAL = 60000; // 1 minute

/**
 * Check if a log line contains any monitored keywords
 */
export function detectKeywords(logLine: string): {
  detected: boolean;
  category?: keyof typeof KEYWORDS;
  keyword?: string;
} {
  const upperLine = logLine.toUpperCase();
  
  for (const [category, config] of Object.entries(KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (upperLine.includes(keyword)) {
        return {
          detected: true,
          category: category as keyof typeof KEYWORDS,
          keyword,
        };
      }
    }
  }
  
  return { detected: false };
}

/**
 * Process a log line and send notification if keyword detected
 */
export async function processLogLine(symbol: string, logLine: string): Promise<void> {
  const detection = detectKeywords(logLine);
  
  if (!detection.detected || !detection.category) {
    return;
  }
  
  // Check throttle
  const throttleKey = `${symbol}-${detection.category}`;
  const lastNotification = throttleMap.get(throttleKey);
  const now = Date.now();
  
  if (lastNotification && (now - lastNotification) < THROTTLE_INTERVAL) {
    // Skip notification (throttled)
    return;
  }
  
  // Update throttle map
  throttleMap.set(throttleKey, now);
  
  // Get keyword config
  const config = KEYWORDS[detection.category];
  
  // Create notification
  try {
    await createNotification({
      type: config.notificationType,
      title: `${symbol}: ${detection.category}`,
      message: logLine.trim(),
      severity: config.priority === 'high' ? 'ERROR' : config.priority === 'normal' ? 'WARNING' : 'INFO',
      data: {
        symbol,
        keyword: detection.keyword,
        category: detection.category,
        priority: config.priority,
        timestamp: new Date().toISOString(),
      },
    });
    
    console.log(`[LogMonitor] Notification sent for ${symbol}: ${detection.category}`);
  } catch (error) {
    console.error(`[LogMonitor] Failed to send notification:`, error);
  }
}

/**
 * Process multiple log lines at once
 */
export async function processLogLines(symbol: string, logLines: string[]): Promise<void> {
  for (const line of logLines) {
    await processLogLine(symbol, line);
  }
}

/**
 * Clear throttle map (for testing)
 */
export function clearThrottle(): void {
  throttleMap.clear();
}
