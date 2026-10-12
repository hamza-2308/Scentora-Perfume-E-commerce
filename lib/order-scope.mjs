// Build a Prisma `where` fragment that scopes order queries to what the caller
// is allowed to see. Pure + unit-testable.
//
//   - CUSTOMER            -> only their own orders (by userId, or legacy email match)
//   - STAFF / BRANCH_MANAGER -> only orders belonging to their branch
//   - SUPER_ADMIN         -> all orders
//   - not authenticated   -> an impossible filter (sees nothing)
export function orderScopeFor(user) {
  if (!user || !user.role) return { id: { in: [] } };

  switch (user.role) {
    case 'SUPER_ADMIN':
      return {};
    case 'BRANCH_MANAGER':
    case 'STAFF':
      return user.branchId ? { branchId: user.branchId } : { id: { in: [] } };
    case 'CUSTOMER':
      return {
        OR: [{ userId: user.sub }, { customerEmail: user.email }],
      };
    default:
      return { id: { in: [] } };
  }
}
