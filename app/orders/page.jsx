import { db } from '@/lib/db';
import { money } from '@/lib/utils';

export default async function Orders({ searchParams }) {
  const sp = await searchParams;
  const success = sp?.success;
  const orders = await db.order.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { items: { include: { product: true } }, branch: true } });
  return (
    <main className="section">
      <div className="container">
        <h1 className="text-3xl sm:text-5xl font-black">Order History</h1>
        {success && <div className="card p-5 mt-6 border-green-200 bg-green-50">Order <b>{success}</b> was placed successfully.</div>}
        <div className="mt-10 grid gap-5">
          {orders.map(o => (
            <div key={o.id} className="card p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <div><b>{o.orderNumber}</b><p className="muted text-sm">{new Date(o.createdAt).toLocaleString()}</p></div>
                <span className="badge w-fit">{o.status}</span>
              </div>
              <div className="mt-4 grid gap-2">
                {o.items.map(i => <div key={i.id} className="flex justify-between text-sm"><span>{i.product.name} × {i.quantity}</span><b>{money(Number(i.unitPrice) * i.quantity)}</b></div>)}
              </div>
              <div className="border-t mt-4 pt-4 flex justify-between"><span>{o.branch.name}</span><b>{money(o.total)}</b></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}