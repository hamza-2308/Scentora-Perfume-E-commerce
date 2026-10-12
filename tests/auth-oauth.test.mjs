import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jwtVerify } from 'jose';

import {
  normalizeProfile,
  findOrCreateGoogleUser,
  safeRedirect,
} from '../lib/google-auth.mjs';
import { orderScopeFor } from '../lib/order-scope.mjs';

const CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
const now = Math.floor(Date.now() / 1000);

// A minimal in-memory stand-in for Prisma's user delegate, enough to exercise
// the find/create/link logic without a database.
function makeDb(initial = []) {
  const users = initial.map(u => ({ ...u }));
  let seq = 0;
  return {
    users,
    user: {
      async findUnique({ where }) {
        if (where.googleId) return users.find(u => u.googleId === where.googleId) || null;
        if (where.email) return users.find(u => u.email === where.email) || null;
        if (where.id) return users.find(u => u.id === where.id) || null;
        return null;
      },
      async create({ data }) {
        if (users.some(u => u.email === data.email)) {
          const e = new Error('Unique constraint failed'); e.code = 'P2002'; throw e;
        }
        if (data.googleId && users.some(u => u.googleId === data.googleId)) {
          const e = new Error('Unique constraint failed'); e.code = 'P2002'; throw e;
        }
        const user = { id: 'u' + ++seq, active: true, ...data };
        users.push(user);
        return { ...user };
      },
      async update({ where, data }) {
        const user = users.find(u => u.id === where.id);
        if (!user) throw new Error('Not found');
        Object.assign(user, data);
        return { ...user };
      },
    },
  };
}

const validProfile = {
  googleId: 'g-123',
  email: 'shopper@gmail.com',
  name: 'Sam Shopper',
  picture: 'https://lh3.googleusercontent.com/a/x',
  emailVerified: true,
};

// ---------------- normalizeProfile (ID token claim validation) ----------------

test('normalizeProfile accepts a valid verified payload', () => {
  const p = normalizeProfile({
    iss: 'https://accounts.google.com',
    aud: CLIENT_ID,
    exp: now + 3600,
    sub: 'g-1',
    email: 'Shopper@Gmail.com ',
    email_verified: true,
    name: 'Sam',
    picture: 'pic',
  }, CLIENT_ID);
  assert.equal(p.email, 'shopper@gmail.com'); // trimmed + lowercased
  assert.equal(p.googleId, 'g-1');
  assert.equal(p.emailVerified, true);
});

test('normalizeProfile accepts the accounts.google.com issuer', () => {
  const p = normalizeProfile({ iss: 'accounts.google.com', aud: CLIENT_ID, exp: now + 60, sub: 'g', email: 'a@b.com', email_verified: true }, CLIENT_ID);
  assert.equal(p.email, 'a@b.com');
});

test('normalizeProfile rejects a bad issuer', () => {
  assert.throws(() => normalizeProfile({ iss: 'https://evil.example', aud: CLIENT_ID, exp: now + 60, sub: 'g', email: 'a@b.com', email_verified: true }, CLIENT_ID), /INVALID_ISSUER/);
});

test('normalizeProfile rejects a mismatched audience', () => {
  assert.throws(() => normalizeProfile({ iss: 'https://accounts.google.com', aud: 'someone-else', exp: now + 60, sub: 'g', email: 'a@b.com', email_verified: true }, CLIENT_ID), /INVALID_AUDIENCE/);
});

test('normalizeProfile rejects an expired token', () => {
  assert.throws(() => normalizeProfile({ iss: 'https://accounts.google.com', aud: CLIENT_ID, exp: now - 10, sub: 'g', email: 'a@b.com', email_verified: true }, CLIENT_ID), /TOKEN_EXPIRED/);
});

test('normalizeProfile rejects an unverified email', () => {
  assert.throws(() => normalizeProfile({ iss: 'https://accounts.google.com', aud: CLIENT_ID, exp: now + 60, sub: 'g', email: 'a@b.com', email_verified: false }, CLIENT_ID), /EMAIL_NOT_VERIFIED/);
});

test('normalizeProfile rejects a missing email', () => {
  assert.throws(() => normalizeProfile({ iss: 'https://accounts.google.com', aud: CLIENT_ID, exp: now + 60, sub: 'g', email_verified: true }, CLIENT_ID), /EMAIL_REQUIRED/);
});

// ---------------- findOrCreateGoogleUser (linking + provisioning policy) ----------------

test('creates a brand-new CUSTOMER (never staff/admin)', async () => {
  const db = makeDb();
  const user = await findOrCreateGoogleUser(db, validProfile);
  assert.equal(user.role, 'CUSTOMER');
  assert.equal(user.email, 'shopper@gmail.com');
  assert.equal(user.googleId, 'g-123');
  assert.equal(user.active, true);
  assert.equal(db.users.length, 1);
});

test('returns the existing user for a returning Google sign-in', async () => {
  const db = makeDb([{ id: 'u1', email: 'shopper@gmail.com', googleId: 'g-123', role: 'CUSTOMER', active: true, avatarUrl: 'old' }]);
  const user = await findOrCreateGoogleUser(db, { ...validProfile, picture: 'new' });
  assert.equal(user.id, 'u1');
  assert.equal(user.avatarUrl, 'new'); // avatar refreshed
  assert.equal(db.users.length, 1); // no duplicate
});

test('does NOT auto-link onto an existing password account', async () => {
  const db = makeDb([{ id: 'u1', email: 'shopper@gmail.com', passwordHash: '$2a$10$abc', role: 'CUSTOMER', active: true }]);
  await assert.rejects(() => findOrCreateGoogleUser(db, validProfile), /EMAIL_IN_USE_PASSWORD/);
  assert.equal(db.users[0].googleId, undefined); // left untouched
});

test('links onto an existing passwordless account with the same email', async () => {
  const db = makeDb([{ id: 'u1', email: 'shopper@gmail.com', passwordHash: null, role: 'CUSTOMER', active: true, avatarUrl: null }]);
  const user = await findOrCreateGoogleUser(db, validProfile);
  assert.equal(user.id, 'u1');
  assert.equal(user.googleId, 'g-123');
  assert.equal(db.users.length, 1);
});

test('rejects a disabled account', async () => {
  const db = makeDb([{ id: 'u1', email: 'shopper@gmail.com', googleId: 'g-123', role: 'CUSTOMER', active: false }]);
  await assert.rejects(() => findOrCreateGoogleUser(db, validProfile), /ACCOUNT_DISABLED/);
});

test('handles a concurrent sign-in race (P2002) by re-fetching', async () => {
  const db = makeDb();
  // Simulate another request creating the user between our find and create.
  db.user.create = async ({ data }) => {
    db.users.push({ id: 'u9', active: true, ...data });
    const e = new Error('Unique constraint failed'); e.code = 'P2002'; throw e;
  };
  const user = await findOrCreateGoogleUser(db, validProfile);
  assert.equal(user.id, 'u9');
  assert.equal(user.role, 'CUSTOMER');
});

// ---------------- safeRedirect (open-redirect protection) ----------------

test('safeRedirect allows local paths', () => {
  assert.equal(safeRedirect('/checkout'), '/checkout');
  assert.equal(safeRedirect('/orders?success=SCN-1'), '/orders?success=SCN-1');
});

test('safeRedirect blocks protocol-relative and external URLs', () => {
  assert.equal(safeRedirect('//evil.com'), '/');
  assert.equal(safeRedirect('https://evil.com'), '/');
  assert.equal(safeRedirect('javascript:alert(1)'), '/');
  assert.equal(safeRedirect('/\\evil.com'), '/');
  assert.equal(safeRedirect('', '/home'), '/home');
  assert.equal(safeRedirect(null), '/');
});

// ---------------- orderScopeFor (customer order isolation) ----------------

test('orderScopeFor isolates customers to their own orders', () => {
  const where = orderScopeFor({ role: 'CUSTOMER', sub: 'u1', email: 'a@b.com' });
  assert.deepEqual(where, { OR: [{ userId: 'u1' }, { customerEmail: 'a@b.com' }] });
});

test('orderScopeFor scopes staff to their branch', () => {
  assert.deepEqual(orderScopeFor({ role: 'STAFF', branchId: 'b1' }), { branchId: 'b1' });
  assert.deepEqual(orderScopeFor({ role: 'BRANCH_MANAGER', branchId: 'b2' }), { branchId: 'b2' });
});

test('orderScopeFor gives SUPER_ADMIN global access', () => {
  assert.deepEqual(orderScopeFor({ role: 'SUPER_ADMIN' }), {});
});

test('orderScopeFor returns an impossible filter for guests / branchless staff', () => {
  assert.deepEqual(orderScopeFor(null), { id: { in: [] } });
  assert.deepEqual(orderScopeFor({ role: 'STAFF', branchId: null }), { id: { in: [] } });
});

// ---------------- session creation (signUser round-trip) ----------------

test('signUser issues a verifiable session JWT with the expected claims', async () => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-value-at-least-32-chars-long!!';
  const { signUser } = await import('../lib/tokens.mjs');
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  const token = await signUser({ id: 'u1', email: 'a@b.com', role: 'CUSTOMER', branchId: null, name: 'Ann', avatarUrl: 'pic' });
  const { payload } = await jwtVerify(token, secret, { issuer: undefined });
  assert.equal(payload.sub, 'u1');
  assert.equal(payload.email, 'a@b.com');
  assert.equal(payload.role, 'CUSTOMER');
  assert.equal(payload.name, 'Ann');
  assert.equal(payload.avatar, 'pic');
  assert.ok(payload.exp > now);
});
