import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

// POST /api/auth/logout
// Clears the session cookie using the shared helper so the cookie name, path
// and attributes exactly match how the session was created (lib/tokens.mjs).
// No authentication is required to log out, and this route is not matched by
// middleware, so it is never blocked.
export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
