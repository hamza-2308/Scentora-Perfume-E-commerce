import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signUser, setSessionCookie } from '@/lib/auth';
import {
  googleConfig,
  exchangeCodeForTokens,
  verifyGoogleIdToken,
  normalizeProfile,
  findOrCreateGoogleUser,
  safeRedirect,
  STATE_COOKIE,
  REDIRECT_COOKIE,
  cookieOptions,
} from '@/lib/google-auth';

// Map internal error codes to a friendly login message.
const ERROR_MESSAGES = {
  GOOGLE_NOT_CONFIGURED: 'Google sign-in is not available right now.',
  OAUTH_DENIED: 'Google sign-in was cancelled.',
  INVALID_STATE: 'Your sign-in session expired. Please try again.',
  TOKEN_EXCHANGE_FAILED: 'Could not complete Google sign-in. Please try again.',
  INVALID_ISSUER: 'Google sign-in could not be verified.',
  INVALID_AUDIENCE: 'Google sign-in could not be verified.',
  TOKEN_EXPIRED: 'Google sign-in expired. Please try again.',
  EMAIL_REQUIRED: 'Google did not return an email address.',
  EMAIL_NOT_VERIFIED: 'Your Google email is not verified.',
  EMAIL_IN_USE_PASSWORD: 'An account with this email already exists. Please sign in with your password.',
  ACCOUNT_DISABLED: 'This account has been disabled.',
};

function toLogin(req, code, redirect) {
  const url = new URL('/login', req.url);
  url.searchParams.set('error', ERROR_MESSAGES[code] || 'Google sign-in failed. Please try again.');
  url.searchParams.set('redirect', safeRedirect(redirect, '/'));
  return NextResponse.redirect(url);
}

// GET /api/auth/google/callback?code=...&state=...
export async function GET(req) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  const savedState = req.cookies.get(STATE_COOKIE)?.value;
  const redirectTarget = safeRedirect(req.cookies.get(REDIRECT_COOKIE)?.value, '/');

  // User declined consent on Google's screen.
  if (oauthError) return toLogin(req, 'OAUTH_DENIED', redirectTarget);

  // CSRF: the state we set must match what Google echoes back.
  if (!state || !savedState || state !== savedState) {
    return toLogin(req, 'INVALID_STATE', redirectTarget);
  }
  if (!code) return toLogin(req, 'TOKEN_EXCHANGE_FAILED', redirectTarget);

  let config;
  try {
    config = googleConfig(origin);
  } catch {
    return toLogin(req, 'GOOGLE_NOT_CONFIGURED', redirectTarget);
  }

  // 1. Exchange the code for tokens (server-side; secret never leaves the server).
  let tokens;
  try {
    tokens = await exchangeCodeForTokens({
      code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
    });
  } catch {
    return toLogin(req, 'TOKEN_EXCHANGE_FAILED', redirectTarget);
  }

  // 2. Verify the ID token signature (Google JWKS), issuer, audience and expiry.
  let profile;
  try {
    const payload = await verifyGoogleIdToken(tokens.id_token, config.clientId);
    profile = normalizeProfile(payload, config.clientId);
  } catch (e) {
    const code2 = ERROR_MESSAGES[e.message] ? e.message : 'TOKEN_EXCHANGE_FAILED';
    return toLogin(req, code2, redirectTarget);
  }

  // 3. Find or create the customer (CUSTOMER role only; safe linking policy).
  let user;
  try {
    user = await findOrCreateGoogleUser(db, profile);
  } catch (e) {
    const code2 = ERROR_MESSAGES[e.message] ? e.message : 'TOKEN_EXCHANGE_FAILED';
    return toLogin(req, code2, redirectTarget);
  }

  // 4. Create the app session using the existing custom JWT + scentora_session cookie.
  const token = await signUser(user);
  const res = NextResponse.redirect(new URL(redirectTarget, req.url));
  setSessionCookie(res, token);

  // Clear the short-lived OAuth handshake cookies.
  const clear = { ...cookieOptions(), maxAge: 0 };
  res.cookies.set(STATE_COOKIE, '', clear);
  res.cookies.set(REDIRECT_COOKIE, '', clear);

  return res;
}
