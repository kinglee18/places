/**
 * Injects a valid NextAuth v5 session cookie so Playwright tests can
 * access protected routes without going through Google OAuth.
 *
 * Uses the same `encode` logic as @auth/core to produce a properly
 * signed+encrypted JWE token that the middleware accepts.
 */
import { encode } from '@auth/core/jwt';
import type { BrowserContext } from '@playwright/test';

const COOKIE_NAME = 'authjs.session-token';

export async function injectSession(context: BrowserContext) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');

  const token = await encode({
    salt: COOKIE_NAME,
    secret,
    token: {
      name: 'Test User',
      email: 'playwright@test.local',
      picture: null,
      sub: 'playwright-test-user',
    },
  });

  await context.addCookies([
    {
      name: COOKIE_NAME,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}
