// Pure, testable authorization guard for order creation.
//
// The order's owning user id MUST come from the verified server-side session
// (JWT `sub`), never from the client. A missing/invalid session is rejected
// with HTTP 401 before any database work happens.

export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

// Given the verified session payload (or null/undefined for a guest), return
// the authenticated user's id, or throw an AuthError(401).
export function requireCustomer(user) {
  if (!user || typeof user.sub !== 'string' || !user.sub) {
    throw new AuthError(401, 'Please login to place your order.');
  }
  return user.sub;
}

// Roles allowed to manage (read/update) orders. Preserves existing permissions.
export const ORDER_MANAGER_ROLES = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF'];

// Guard for order management endpoints (GET list, PATCH status).
export function requireOrderManager(user) {
  if (!user || !ORDER_MANAGER_ROLES.includes(user.role)) {
    // Customers are allowed to READ their own orders (scoped elsewhere), but
    // only staff roles may list all orders or change order status.
    if (user && user.role === 'CUSTOMER') return { role: user.role, sub: user.sub };
    throw new AuthError(401, 'Unauthorized');
  }
  return { role: user.role, sub: user.sub };
}
