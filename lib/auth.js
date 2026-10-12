import { cookies } from 'next/headers';
import {
  signUser,
  verifyToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieOptions,
  setSessionCookie,
  clearSessionCookie,
} from '@/lib/tokens';

// Re-export the pure session helpers so every existing import site
// (login, signup, me, orders, admin layout, ...) keeps working unchanged.
export {
  signUser,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieOptions,
  setSessionCookie,
  clearSessionCookie,
};

// Read + verify the current session from the request cookies.
// Returns the JWT payload, or null when there is no valid session.
export async function getUser() {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  return verifyToken(token);
}

export async function requireAdmin() {
  const u = await getUser();
  if (!u || !['SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF'].includes(u.role)) throw new Error('UNAUTHORIZED');
  return u;
}
