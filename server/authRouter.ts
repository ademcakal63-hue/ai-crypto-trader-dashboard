import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { loginWithEmail, COOKIE_NAME, verifySessionToken } from './simpleAuth';
import { getSessionCookieOptions } from './_core/cookies';

export const authRouter = router({
  // Mevcut kullanıcı bilgisi
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  
  // Email/şifre ile giriş
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await loginWithEmail(input.email, input.password);
      
      if (result.success && result.token) {
        // Cookie'yi ayarla
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, result.token, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 gün
        });
        
        return {
          success: true,
          user: result.user,
        };
      }
      
      return {
        success: false,
        error: result.error || 'Giriş başarısız',
      };
    }),
  
  // Çıkış yap
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
});
