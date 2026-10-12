import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { orderScopeFor } from '@/lib/order-scope';
import { requireCustomer, requireOrderManager, AuthError } from '@/lib/order-guard';

function num(v) { return Number(v); }

// Any authenticated user may read orders, but results are scoped to what they
// are allowed to see (customers -> own orders; staff -> their branch; admin -> all).
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await db.order.findMany({ where: orderScopeFor(user), include: { customer: true, branch: true, items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } }));
}

export async function POST(req) {
  // 1. Require a valid authenticated session. The owning user id is derived
  //    exclusively from the verified server-side JWT (never from the client).
  let userId;
  try {
    userId = requireCustomer(await getUser());
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  try {
    const b = await req.json();
    if (!b.items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

    // 2. Validate every line item server-side (never trust client prices/totals).
    for (const i of b.items) {
      const q = num(i.qty);
      if (!Number.isInteger(q) || q < 1 || q > 50) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
      if (typeof i.id !== 'string' || !i.id) return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
    }
    if (!b.customer?.name || !b.customer?.email) return NextResponse.json({ error: 'Delivery details are required' }, { status: 400 });

    // 3. Defense-in-depth: confirm the session user still exists and is active.
    const dbUser = await db.user.findUnique({ where: { id: userId }, select: { id: true, active: true } });
    if (!dbUser || !dbUser.active) return NextResponse.json({ error: 'Please login to place your order.' }, { status: 401 });

    const customer = await db.customer.upsert({ where: { email: b.customer.email }, update: { name: b.customer.name, phone: b.customer.phone, address: b.customer.address, city: b.customer.city }, create: b.customer });
    const order = await db.$transaction(async tx => {
      const branch = await tx.branch.findFirst({ where: { active: true, city: b.customer.city } }) || await tx.branch.findFirst({ where: { active: true } });
      if (!branch) throw new Error('No branch available');
      let total = 0; const rows = [];
      for (const i of b.items) {
        const p = await tx.product.findUnique({ where: { id: i.id } });
        if (!p) throw new Error('Product not found');
        const price = num(p.price) * (1 - num(p.discount) / 100);
        total += price * num(i.qty);
        rows.push({ productId: p.id, quantity: num(i.qty), unitPrice: price });
        const inv = await tx.inventory.findUnique({ where: { productId_branchId: { productId: p.id, branchId: branch.id } } });
        if (!inv || inv.stock < num(i.qty)) throw new Error(`${p.name} is out of stock at ${branch.name}`);
        await tx.inventory.update({ where: { id: inv.id }, data: { stock: { decrement: num(i.qty) } } });
      }
      return tx.order.create({ data: { orderNumber: 'SCN-' + Date.now().toString(36).toUpperCase(), customerId: customer.id, branchId: branch.id, userId, status: 'PENDING', paymentStatus: 'PENDING', total, shippingAddress: b.customer.address || '', customerName: b.customer.name, customerEmail: b.customer.email, customerPhone: b.customer.phone || '', items: { create: rows } } });
    });
    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Order failed' }, { status: 400 });
  }
}

export async function PATCH(req) {
  // Only staff roles may change order status.
  try {
    requireOrderManager(await getUser());
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { id, ...data } = await req.json();
  return NextResponse.json(await db.order.update({ where: { id }, data }));
}
