import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  signUser,
  verifyToken,
  clearSessionCookie,
  setSessionCookie,
  sessionCookieOptions,
  SESSION_COOKIE,
} from '../lib/tokens.mjs';

// A minimal stand-in for a NextResponse, capturing the cookies that get set.
function mockRes() {
  const jar = {};
  return {
    jar,
    cookies: {
      set(name, value, opts) {
        jar[name] = { value, opts };
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Logout must clear the SAME cookie (name/path/attributes) used at login.
// ---------------------------------------------------------------------------

test('clearSessionCookie sets the session cookie to empty with maxAge 0', () => {
  const res = mockRes();
  clearSessionCookie(res);
  const cleared = res.jar[SESSION_COOKIE];
  assert.ok(cleared, 'session cookie was set');
  assert.equal(cleared.value, '');
  assert.equal(cleared.opts.maxAge, 0);
});

test('logout cookie attributes match session-creation attributes', () => {
  const created = sessionCookieOptions();
  const res = mockRes();
  clearSessionCookie(res);
  const cleared = res.jar[SESSION_COOKIE].opts;

  // Same name is guaranteed by using SESSION_COOKIE for both.
  assert.equal(SESSION_COOKIE, 'scentora_session');
  // Same security-relevant attributes so the browser actually clears it.
  assert.equal(cleared.httpOnly, created.httpOnly);
  assert.equal(cleared.sameSite, created.sameSite);
  assert.equal(cleared.secure, created.secure);
  assert.equal(cleared.path, created.path);
});

test('setSessionCookie then clearSessionCookie targets the same cookie name', () => {
  const res = mockRes();
  setSessionCookie(res, 'some.jwt.token');
  assert.equal(res.jar[SESSION_COOKIE].value, 'some.jwt.token');
  assert.ok(res.jar[SESSION_COOKIE].opts.maxAge > 0);

  clearSessionCookie(res);
  assert.equal(res.jar[SESSION_COOKIE].value, '');
  assert.equal(res.jar[SESSION_COOKIE].opts.maxAge, 0);
});

// ---------------------------------------------------------------------------
// Regression: after logout the (now empty) cookie must not authenticate.
// ---------------------------------------------------------------------------

test('an empty/cleared cookie value does not verify as a session', async () => {
  // This is exactly what the browser stores after logout clears the cookie.
  assert.equal(await verifyToken(''), null);
  assert.equal(await verifyToken(undefined), null);
});

test('a previously valid token verifies, but the cleared cookie does not', async () => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-value-at-least-32-chars-long!!';
  const token = await signUser({ id: 'u1', email: 'a@b.com', role: 'CUSTOMER', branchId: null });
  // Before logout: the real token verifies.
  assert.ok(await verifyToken(token));
  // After logout the client only has the empty string the server set.
  const clearedValue = '';
  assert.equal(await verifyToken(clearedValue), null);
});
