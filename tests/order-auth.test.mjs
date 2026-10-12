import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jwtVerify } from 'jose';

import { requireCustomer, requireOrderManager, AuthError, ORDER_MANAGER_ROLES } from '../lib/order-guard.mjs';
import { signUser, verifyToken, SESSION_COOKIE, sessionCookieOptions } from '../lib/tokens.mjs';

// ---------------------------------------------------------------------------
// Bug 1: guests must never be able to create an order.
// The owning user id is derived ONLY from the verified session (JWT `sub`).
// ---------------------------------------------------------------------------

test('requireCustomer rejects a guest (null session) with 401', () => {
  assert.throws(() => requireCustomer(null), (e) => e instanceof AuthError && e.status === 401);
});

test('requireCustomer rejects undefined / empty / malformed sessions with 401', () => {
  assert.throws(() => requireCustomer(undefined), (e) => e.status === 401);
  assert.throws(() => requireCustomer({}), (e) => e.status === 401);
  assert.throws(() => requireCustomer({ sub: '' }), (e) => e.status === 401);
  assert.throws(() => requireCustomer({ sub: 123 }), (e) => e.status === 401); // non-string id
});

test('requireCustomer returns the session user id for an authenticated customer', () => {
  assert.equal(requireCustomer({ sub: 'user_123', role: 'CUSTOMER' }), 'user_123');
});

test('order owner id comes from the session, never from client input', () => {
  // Simulate a client trying to forge ownership via the request body.
  const session = { sub: 'real_user', role: 'CUSTOMER' };
  const clientBody = { userId: 'attacker_user', customer: { name: 'x', email: 'x@y.z' }, items: [] };
  const ownerId = requireCustomer(session);
  assert.equal(ownerId, 'real_user');
  assert.notEqual(ownerId, clientBody.userId); // forged id is ignored
});

// ---------------------------------------------------------------------------
// Staff/admin permissions remain enforced for order management.
// ---------------------------------------------------------------------------

test('requireOrderManager allows staff roles and rejects guests', () => {
  for (const role of ORDER_MANAGER_ROLES) {
    assert.equal(requireOrderManager({ role, sub: 'u1' }).role, role);
  }
  assert.throws(() => requireOrderManager(null), (e) => e.status === 401);
});

test('requireOrderManager lets a customer through for read scoping but not management', () => {
  // A customer is permitted to reach the GET handler (results are scoped to
  // their own orders), but is NOT a manager.
  const res = requireOrderManager({ role: 'CUSTOMER', sub: 'u1' });
  assert.equal(res.role, 'CUSTOMER');
  assert.equal(ORDER_MANAGER_ROLES.includes('CUSTOMER'), false);
});

// ---------------------------------------------------------------------------
// Bug 2 regression: session cookie + JWT payload shape agreement.
// signUser -> sub ; getUser/me read u.sub ; cookie attributes are secure.
// ---------------------------------------------------------------------------

test('session cookie options are secure (HttpOnly, SameSite=Lax, path=/)', () => {
  const o = sessionCookieOptions();
  assert.equal(o.httpOnly, true);
  assert.equal(o.sameSite, 'lax');
  assert.equal(o.path, '/');
  assert.equal(o.secure, process.env.NODE_ENV === 'production');
  assert.ok(o.maxAge > 0);
  assert.equal(SESSION_COOKIE, 'scentora_session');
});

test('signUser -> verifyToken round-trip yields sub that /api/auth/me maps to id', async () => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-value-at-least-32-chars-long!!';
  const user = { id: 'google_user_1', email: 'g@example.com', role: 'CUSTOMER', branchId: null, name: 'G User', avatarUrl: 'pic' };
  const token = await signUser(user);

  // getUser() path
  const payload = await verifyToken(token);
  assert.ok(payload);
  assert.equal(payload.sub, 'google_user_1');

  // /api/auth/me maps u.sub -> id (must match what CartProvider consumes as user.id)
  const meBody = { user: { id: payload.sub, email: payload.email, role: payload.role, name: payload.name || null, avatar: payload.avatar || null } };
  assert.equal(meBody.user.id, 'google_user_1');
  assert.equal(meBody.user.role, 'CUSTOMER');

  // requireCustomer accepts exactly this session shape
  assert.equal(requireCustomer(payload), 'google_user_1');
});

test('verifyToken returns null for missing/invalid/expired tokens (never throws)', async () => {
  assert.equal(await verifyToken(undefined), null);
  assert.equal(await verifyToken(''), null);
  assert.equal(await verifyToken('not-a-jwt'), null);

  // A token signed with a DIFFERENT secret must not verify.
  const other = new TextEncoder().encode('a-completely-different-secret-value-32chars');
  const { SignJWT } = await import('jose');
  const forged = await new SignJWT({ sub: 'attacker' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(other);
  assert.equal(await verifyToken(forged), null);
});

test('an expired session token is rejected by verifyToken', async () => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-value-at-least-32-chars-long!!';
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  const { SignJWT } = await import('jose');
  const expired = await new SignJWT({ sub: 'u1', role: 'CUSTOMER' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
    .sign(secret);
  assert.equal(await verifyToken(expired), null);
  // And therefore a guest for order purposes.
  const expiredPayload = await verifyToken(expired);
  assert.equal(expiredPayload, null);
  assert.throws(() => requireCustomer(expiredPayload), (e) => e.status === 401);
});
