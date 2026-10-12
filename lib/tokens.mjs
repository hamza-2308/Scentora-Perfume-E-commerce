import { jwtVerify, SignJWT } from 'jose';

// Pure session/JWT logic with no dependency on next/headers, so it can be used
// both inside the Next.js runtime and in unit tests. lib/auth.js re-exports
// these so the existing public API (signUser, getUser, requireAdmin, ...) is
// unchanged.
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me');

export const SESSION_COOKIE = 'scentora_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Central, secure session cookie options reused by login, signup and Google OAuth.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

export function setSessionCookie(res, token) {
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export function clearSessionCookie(res) {
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
}

export async function signUser(user) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    name: user.name || null,
    avatar: user.avatarUrl || null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

// Verify a raw token string. Returns the payload, or null if missing/invalid.
// Never throws, so callers can treat any failure as "not signed in".
export async function verifyToken(token) {
  if (!token) return null;
  try {
    return (await jwtVerify(token, secret)).payload;
  } catch {
    return null;
  }
}
