import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginWithEmail, verifySessionToken, COOKIE_NAME } from './simpleAuth';

describe('Simple Auth', () => {
  describe('loginWithEmail', () => {
    it('should login successfully with correct admin credentials', async () => {
      const result = await loginWithEmail('ademcakal63@gmail.com', 'Nabrakon.CYX0');
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('ademcakal63@gmail.com');
      expect(result.user?.role).toBe('admin');
      expect(result.user?.name).toBe('Admin');
    });
    
    it('should fail with incorrect password', async () => {
      const result = await loginWithEmail('ademcakal63@gmail.com', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Geçersiz şifre');
      expect(result.token).toBeUndefined();
    });
    
    it('should fail with unknown email', async () => {
      const result = await loginWithEmail('unknown@example.com', 'anypassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Kullanıcı bulunamadı');
    });
  });
  
  describe('verifySessionToken', () => {
    it('should verify a valid token', async () => {
      // First login to get a token
      const loginResult = await loginWithEmail('ademcakal63@gmail.com', 'Nabrakon.CYX0');
      expect(loginResult.token).toBeDefined();
      
      // Verify the token
      const user = await verifySessionToken(loginResult.token!);
      
      expect(user).not.toBeNull();
      expect(user?.email).toBe('ademcakal63@gmail.com');
      expect(user?.role).toBe('admin');
    });
    
    it('should return null for invalid token', async () => {
      const user = await verifySessionToken('invalid-token');
      expect(user).toBeNull();
    });
    
    it('should return null for empty token', async () => {
      const user = await verifySessionToken('');
      expect(user).toBeNull();
    });
  });
  
  describe('COOKIE_NAME', () => {
    it('should be defined', () => {
      expect(COOKIE_NAME).toBe('auth_session');
    });
  });
});
