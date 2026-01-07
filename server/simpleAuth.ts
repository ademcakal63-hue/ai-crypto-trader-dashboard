import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { parse as parseCookieHeader } from 'cookie';
import type { Request } from 'express';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'auth_session';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

// Admin kullanıcı bilgileri
const ADMIN_EMAIL = 'ademcakal63@gmail.com';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('Nabrakon.CYX0', 10);

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

/**
 * Email/şifre ile giriş yap
 */
export async function loginWithEmail(email: string, password: string): Promise<{ success: boolean; token?: string; user?: AuthUser; error?: string }> {
  // Admin kontrolü
  if (email === ADMIN_EMAIL) {
    const isValid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
    if (!isValid) {
      return { success: false, error: 'Geçersiz şifre' };
    }
    
    // Admin kullanıcıyı database'e ekle/güncelle
    const db = await getDb();
    if (db) {
      try {
        await db.insert(users).values({
          openId: `email:${email}`,
          name: 'Admin',
          email: email,
          loginMethod: 'email',
          role: 'admin',
          lastSignedIn: new Date(),
        }).onDuplicateKeyUpdate({
          set: {
            lastSignedIn: new Date(),
          },
        });
      } catch (error) {
        console.error('[Auth] Failed to upsert admin user:', error);
      }
    }
    
    // JWT token oluştur
    const token = await createSessionToken({
      id: 1,
      email: email,
      name: 'Admin',
      role: 'admin',
    });
    
    return {
      success: true,
      token,
      user: {
        id: 1,
        email: email,
        name: 'Admin',
        role: 'admin',
      },
    };
  }
  
  return { success: false, error: 'Kullanıcı bulunamadı' };
}

/**
 * JWT token oluştur
 */
async function createSessionToken(user: AuthUser): Promise<string> {
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  const expirationTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 gün
  
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(expirationTime)
    .sign(secretKey);
}

/**
 * JWT token doğrula
 */
export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    
    return {
      id: payload.id as number,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as 'admin' | 'user',
    };
  } catch (error) {
    console.warn('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Request'ten kullanıcı bilgisini al
 */
export async function authenticateRequest(req: Request): Promise<AuthUser | null> {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }
  
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[COOKIE_NAME];
  
  if (!token) {
    return null;
  }
  
  return verifySessionToken(token);
}

export { COOKIE_NAME };
