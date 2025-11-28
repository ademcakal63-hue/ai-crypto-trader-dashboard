import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

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
    summary: publicProcedure.query(async () => {
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
  }),
  
  // Binance API Routers
  binance: router({
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
