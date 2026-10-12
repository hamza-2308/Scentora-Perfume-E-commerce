import { jwtVerify, createRemoteJWKSet } from 'jose';
import { randomBytes } from 'node:crypto';

// --- Google OAuth 2.0 (Authorization Code + ID token) configuration ---
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
export const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

// Cookie names used only for the OAuth handshake (short lived).
export const STATE_COOKIE = 'google_oauth_state';
export const REDIRECT_COOKIE = 'google_oauth_redirect';

// Lazily created + cached JWKS (no network on import).
let _jwks;
function getJwks() {
  if (!_jwks) _jwks = createRemoteJWKSet(new URL(GOOGLE_CERTS_URL));
  return _jwks;
}

// Base cookie options shared by the OAuth handshake cookies.
export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

// Read Google credentials from the environment. Throws if not configured so we
// never fall back to insecure defaults.
export function googleConfig(origin) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('GOOGLE_NOT_CONFIGURED');
  const redirectUri = `${origin}/api/auth/google/callback`;
  return { clientId, clientSecret, redirectUri };
}

// Cryptographically random state value to mitigate CSRF on the OAuth flow.
export function createState() {
  return randomBytes(32).toString('hex');
}

// Build the Google consent screen URL.
export function buildConsentUrl({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// Exchange the authorization code for tokens (server-to-server, secret stays on server).
export async function exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri }) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id_token) throw new Error('TOKEN_EXCHANGE_FAILED');
  return data;
}

// Verify a Google ID token: signature (via Google JWKS), issuer, audience, expiry.
// Returns the raw JWT payload.
export async function verifyGoogleIdToken(idToken, clientId) {
  const { payload } = await jwtVerify(idToken, getJwks(), {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });
  return payload;
}

// Validate + normalize the verified payload into a trusted profile.
// Pure function (no network) so it is unit-testable.
export function normalizeProfile(payload, clientId) {
  const iss = payload?.iss;
  if (iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com') {
    throw new Error('INVALID_ISSUER');
  }
  if (payload?.aud !== clientId) throw new Error('INVALID_AUDIENCE');
  if (!payload?.exp || payload.exp * 1000 < Date.now()) throw new Error('TOKEN_EXPIRED');
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email) throw new Error('EMAIL_REQUIRED');
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
  if (!emailVerified) throw new Error('EMAIL_NOT_VERIFIED');
  return {
    googleId: payload.sub,
    email,
    name: typeof payload.name === 'string' ? payload.name.trim() : '',
    picture: typeof payload.picture === 'string' ? payload.picture : '',
    emailVerified: true,
  };
}

// Find an existing user or create a new CUSTOMER for a verified Google profile.
// Secure account-linking policy:
//   - Match by googleId first (returning Google user).
//   - Match by email ONLY when the existing account has no password set. We never
//     auto-link a Google identity onto a password account, because Scentora signup
//     does not verify emails and that would enable account pre-hijacking.
//   - Otherwise create a brand-new CUSTOMER (never staff/admin).
// Handles concurrent sign-in races (Prisma P2002) by re-fetching.
export async function findOrCreateGoogleUser(db, profile) {
  const { googleId, email, name, picture, emailVerified } = profile;
  if (!emailVerified) throw new Error('EMAIL_NOT_VERIFIED');

  // 1. Returning Google user.
  const byGoogle = await db.user.findUnique({ where: { googleId } });
  if (byGoogle) {
    if (!byGoogle.active) throw new Error('ACCOUNT_DISABLED');
    if (picture && byGoogle.avatarUrl !== picture) {
      return db.user.update({ where: { id: byGoogle.id }, data: { avatarUrl: picture } });
    }
    return byGoogle;
  }

  // 2. Existing account with the same email.
  const byEmail = await db.user.findUnique({ where: { email } });
  if (byEmail) {
    if (!byEmail.active) throw new Error('ACCOUNT_DISABLED');
    if (byEmail.passwordHash) {
      // Credential account with an unverified email -> do NOT auto-link.
      throw new Error('EMAIL_IN_USE_PASSWORD');
    }
    // No password set (prior social/incomplete account) -> safe to link.
    return db.user.update({
      where: { id: byEmail.id },
      data: { googleId, avatarUrl: byEmail.avatarUrl || picture || null },
    });
  }

  // 3. New customer.
  try {
    return await db.user.create({
      data: {
        name: name || email.split('@')[0],
        email,
        googleId,
        avatarUrl: picture || null,
        role: 'CUSTOMER', // Google sign-in can never create or promote staff/admin.
        active: true,
      },
    });
  } catch (e) {
    if (e && e.code === 'P2002') {
      const existing =
        (await db.user.findUnique({ where: { googleId } })) ||
        (await db.user.findUnique({ where: { email } }));
      if (existing) return existing;
    }
    throw e;
  }
}

// Only allow local, same-site redirect targets (prevents open-redirect).
export function safeRedirect(path, fallback = '/') {
  if (typeof path !== 'string' || !path) return fallback;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback;
  return path;
}
