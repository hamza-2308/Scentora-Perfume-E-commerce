import { NextResponse } from 'next/server';
import {
  googleConfig,
  buildConsentUrl,
  createState,
  safeRedirect,
  STATE_COOKIE,
  REDIRECT_COOKIE,
  cookieOptions,
} from '@/lib/google-auth';

// GET /api/auth/google?redirect=/checkout
// Starts the Google OAuth 2.0 Authorization Code flow. We store a random state
// (CSRF protection) and the post-login redirect target in short-lived HttpOnly
// cookies, then send the user to Google's consent screen.
export async function GET(req) {
  const url = new URL(req.url);
  const origin = url.origin;
  const redirect = safeRedirect(url.searchParams.get('redirect'), '/');

  let config;
  try {
    config = googleConfig(origin);
  } catch {
    const login = new URL('/login', req.url);
    login.searchParams.set('error', 'Google sign-in is not available right now.');
    login.searchParams.set('redirect', redirect);
    return NextResponse.redirect(login);
  }

  const state = createState();
  const consentUrl = buildConsentUrl({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    state,
  });

  const res = NextResponse.redirect(consentUrl);
  const base = cookieOptions();
  // 10-minute handshake cookies.
  res.cookies.set(STATE_COOKIE, state, { ...base, maxAge: 600 });
  res.cookies.set(REDIRECT_COOKIE, redirect, { ...base, maxAge: 600 });
  return res;
}
