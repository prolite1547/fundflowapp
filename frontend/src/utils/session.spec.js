import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  AUTH_CHANGE_EVENT,
  getAccessToken,
  getRefreshToken,
  dispatchAuthChange,
  setSessionTokens,
  clearSession,
  getTokenExpiryMs,
  isTokenExpired,
} from './session';

// Build a real-ish JWT with a given exp (seconds since epoch)
const buildJwt = (exp) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'user', exp }));
  return `${header}.${payload}.signature`;
};

describe('session utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // --- constants ---
  it('exports the correct token keys and event name', () => {
    expect(ACCESS_TOKEN_KEY).toBe('token');
    expect(REFRESH_TOKEN_KEY).toBe('refreshToken');
    expect(AUTH_CHANGE_EVENT).toBe('fundflow:auth-changed');
  });

  // --- getAccessToken ---
  describe('getAccessToken', () => {
    it('returns null when no token is stored', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('returns the stored access token', () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'my-token');
      expect(getAccessToken()).toBe('my-token');
    });
  });

  // --- getRefreshToken ---
  describe('getRefreshToken', () => {
    it('returns null when no refresh token is stored', () => {
      expect(getRefreshToken()).toBeNull();
    });

    it('returns the stored refresh token', () => {
      localStorage.setItem(REFRESH_TOKEN_KEY, 'my-refresh-token');
      expect(getRefreshToken()).toBe('my-refresh-token');
    });
  });

  // --- dispatchAuthChange ---
  describe('dispatchAuthChange', () => {
    it('dispatches the AUTH_CHANGE_EVENT on window', () => {
      const listener = vi.fn();
      window.addEventListener(AUTH_CHANGE_EVENT, listener);
      dispatchAuthChange();
      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener(AUTH_CHANGE_EVENT, listener);
    });
  });

  // --- setSessionTokens ---
  describe('setSessionTokens', () => {
    it('stores both tokens and dispatches auth change event', () => {
      const listener = vi.fn();
      window.addEventListener(AUTH_CHANGE_EVENT, listener);

      setSessionTokens({ accessToken: 'at', refreshToken: 'rt' });

      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('rt');
      expect(listener).toHaveBeenCalledTimes(1);

      window.removeEventListener(AUTH_CHANGE_EVENT, listener);
    });

    it('only stores accessToken when refreshToken is omitted', () => {
      setSessionTokens({ accessToken: 'at-only' });
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at-only');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    });

    it('only stores refreshToken when accessToken is omitted', () => {
      setSessionTokens({ refreshToken: 'rt-only' });
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('rt-only');
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    });
  });

  // --- clearSession ---
  describe('clearSession', () => {
    it('removes both tokens from localStorage and dispatches auth change', () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'at');
      localStorage.setItem(REFRESH_TOKEN_KEY, 'rt');

      const listener = vi.fn();
      window.addEventListener(AUTH_CHANGE_EVENT, listener);

      clearSession();

      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
      expect(listener).toHaveBeenCalledTimes(1);

      window.removeEventListener(AUTH_CHANGE_EVENT, listener);
    });
  });

  // --- getTokenExpiryMs ---
  describe('getTokenExpiryMs', () => {
    it('returns null for a null / undefined token', () => {
      expect(getTokenExpiryMs(null)).toBeNull();
      expect(getTokenExpiryMs(undefined)).toBeNull();
    });

    it('returns null for a malformed token', () => {
      expect(getTokenExpiryMs('not.a.jwt')).toBeNull();
      expect(getTokenExpiryMs('bad')).toBeNull();
    });

    it('returns expiry in milliseconds for a valid JWT', () => {
      const expSeconds = Math.floor(Date.now() / 1000) + 3600;
      const token = buildJwt(expSeconds);
      expect(getTokenExpiryMs(token)).toBe(expSeconds * 1000);
    });
  });

  // --- isTokenExpired ---
  describe('isTokenExpired', () => {
    it('returns true for a null token (no exp)', () => {
      expect(isTokenExpired(null)).toBe(true);
    });

    it('returns true for a malformed token', () => {
      expect(isTokenExpired('bad-token')).toBe(true);
    });

    it('returns false for a token that expires in the future', () => {
      const expSeconds = Math.floor(Date.now() / 1000) + 3600;
      const token = buildJwt(expSeconds);
      expect(isTokenExpired(token)).toBe(false);
    });

    it('returns true for an already-expired token', () => {
      const expSeconds = Math.floor(Date.now() / 1000) - 1;
      const token = buildJwt(expSeconds);
      expect(isTokenExpired(token)).toBe(true);
    });

    it('respects the skewMs buffer', () => {
      // expires 2 seconds from now, but skew is 5 seconds → should be "expired"
      const expSeconds = Math.floor(Date.now() / 1000) + 2;
      const token = buildJwt(expSeconds);
      expect(isTokenExpired(token, 5000)).toBe(true);
    });
  });
});
