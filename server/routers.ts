import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Trading Dashboard Routers
  dashboard: router({
    balance: publicProcedure.query(async () => {
      const { getBinanceBalance } = await import('./binanceBalance');
      return await getBinanceBalance();
    }),
    
    overview: publicProcedure.query(async () => {
      const { getDashboardSummary } = await import('./tradingDb');
      return await getDashboardSummary();
    }),
    
    openPositions: publicProcedure.query(async () => {
      const { getOpenPositions } = await import('./tradingDb');
      return await getOpenPositions();
    }),
    
    tradeHistory: publicProcedure.query(async () => {
      const { getTradeHistory } = await import('./tradingDb');
      return await getTradeHistory(50);
    }),
    
    performance: publicProcedure.query(async () => {
      const { getPerformanceHistory } = await import('./tradingDb');
      return await getPerformanceHistory(7);
    }),
    
    aiLearning: publicProcedure.query(async () => {
      const { getLatestAiLearning } = await import('./tradingDb');
      return await getLatestAiLearning();
    }),
    
    performanceMetrics: publicProcedure.query(async () => {
      const { getAllPerformanceMetrics } = await import('./tradingDb');
      return await getAllPerformanceMetrics();
    }),
  }),
  
  // Bot API Routers (Trading Bot'un veri göndermesi için)
  bot: router({
    openPosition: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null) {
          return val as any;
        }
        throw new Error('Invalid input');
      })
      .mutation(async ({ input }) => {
        const { openPosition } = await import('./botApi');
        return await openPosition(input);
      }),
    
    updatePosition: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null) {
          return val as any;
        }
        throw new Error('Invalid input');
      })
      .mutation(async ({ input }) => {
        const { updatePosition } = await import('./botApi');
        return await updatePosition(input);
      }),
    
    closePosition: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null) {
          return val as any;
        }
        throw new Error('Invalid input');
      })
      .mutation(async ({ input }) => {
        const { closePosition } = await import('./botApi');
        return await closePosition(input);
      }),
    
    updateMetrics: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null) {
          return val as any;
        }
        throw new Error('Invalid input');
      })
      .mutation(async ({ input }) => {
        const { updatePerformanceMetrics } = await import('./botApi');
        return await updatePerformanceMetrics(input);
      }),
    
    emergencyStop: publicProcedure.mutation(async () => {
      const { emergencyStopAll } = await import('./botApi');
      return await emergencyStopAll();
    }),
    
    notification: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null) {
          return val as any;
        }
        throw new Error('Invalid input');
      })
      .mutation(async ({ input }) => {
        const { createNotification } = await import('./notificationService');
        return await createNotification(input);
      }),
    
    // Bot process control
    start: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'symbol' in val) {
          return val as { symbol: string };
        }
        throw new Error('Invalid input');
      })
      .mutation(async ({ input }) => {
        const { startBot } = await import('./botControl');
        return await startBot(input.symbol);
      }),
    
    stop: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'symbol' in val) {
          return val as { symbol: string };
        }
        throw new Error('Invalid input');
      })
      .mutation(async ({ input }) => {
        const { stopBot } = await import('./botControl');
        return await stopBot(input.symbol);
      }),
    
    status: publicProcedure.query(async () => {
      const { getBotStatus } = await import('./botControl');
      return await getBotStatus();
    }),
    
    logs: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'symbol' in val) {
          return val as { symbol: string };
        }
        throw new Error('Invalid input');
      })
      .query(async ({ input }) => {
        const { getBotLogs } = await import('./botControl');
        return await getBotLogs(input.symbol);
      }),
  }),
  
  // Bildirim Routers
  notifications: router({
    list: publicProcedure.query(async () => {
      const { getNotifications } = await import('./notificationService');
      return await getNotifications(50);
    }),
    
    unread: publicProcedure.query(async () => {
      const { getUnreadNotifications } = await import('./notificationService');
      return await getUnreadNotifications();
    }),
    
    markAsRead: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'id' in val) {
          return val as { id: number };
        }
        throw new Error('Invalid input');
      })
      .mutation(async ({ input }) => {
        const { markAsRead } = await import('./notificationService');
        return await markAsRead(input.id);
      }),
    
    markAllAsRead: publicProcedure.mutation(async () => {
      const { markAllAsRead } = await import('./notificationService');
      return await markAllAsRead();
    }),
  }),
  
  // Daily Loss Control
  dailyLoss: router({
    check: publicProcedure.query(async () => {
      const { checkDailyLossLimit } = await import('./dailyLossControl');
      return await checkDailyLossLimit();
    }),
  }),
  
  // Settings Routers
  settings: router({
    validateApiKey: publicProcedure
      .input(z.object({
        apiKey: z.string(),
        apiSecret: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { validateBinanceApiKey } = await import('./validateApiKey');
        return await validateBinanceApiKey(input.apiKey, input.apiSecret);
      }),
    
    get: publicProcedure.query(async () => {
      const { getBotSettings } = await import('./settingsDb');
      return await getBotSettings();
    }),
    
    update: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null) {
          return val as any;
        }
        throw new Error('Invalid input');
      })
      .mutation(async ({ input }) => {
        const { updateBotSettings } = await import('./settingsDb');
        return await updateBotSettings(input);
      }),
    
    toggleBot: publicProcedure
      .input(z.object({
        isActive: z.boolean(),
        closePositions: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { toggleBot } = await import('./settingsDb');
        return await toggleBot(input.isActive, input.closePositions || false);
      }),
  }),
  
  // Binance API Routers
  binance: router({
    balance: publicProcedure.query(async () => {
      const { getBinanceBalance } = await import('./binanceBalance');
      const result = await getBinanceBalance();
      if (!result) {
        return { balance: null };
      }
      return { balance: result.total };
    }),
    
    currentPrice: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'symbol' in val) {
          return val as { symbol: string };
        }
        throw new Error('Invalid input');
      })
      .query(async ({ input }) => {
        const { getCurrentPrice } = await import('./binance');
        const price = await getCurrentPrice(input.symbol);
        return { symbol: input.symbol, price };
      }),
    
    allPrices: publicProcedure.query(async () => {
      const { getAllPrices, SUPPORTED_PAIRS } = await import('./binance');
      const allPrices = await getAllPrices();
      
      // Sadece desteklenen pair'leri döndür
      const filtered: Record<string, number> = {};
      for (const pair of SUPPORTED_PAIRS) {
        if (allPrices[pair]) {
          filtered[pair] = allPrices[pair];
        }
      }
      
      return filtered;
    }),
  }),
});

export type AppRouter = typeof appRouter;
