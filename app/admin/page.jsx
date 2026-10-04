import { db } from '@/lib/db';
import { money } from '@/lib/utils';
import Link from 'next/link';

export default async function Dashboard() {
  const [products, branches, customers, orders, inv] = await Promise.all([
    db.product.count({ where: { active: true } }),
    db.branch.count({ where: { active: true } }),
    db.customer.count(),
    db.order.findMany({ where: { status: { not: 'CANCELLED' } }, include: { items: true }, orderBy: { createdAt: 'desc' } }),
    db.inventory.findMany(),
  ]);
  const sales = orders.reduce((s, o) => s + Number(o.total), 0);
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const today = orders.filter(o => o.createdAt >= day).reduce((s, o) => s + Number(o.total), 0);
  const low = inv.filter(i => i.stock <= i.lowStockThreshold).length;
  const cards = [
    ['Total Products', products],
    ['Total Branches', branches],
    ['Total Customers', customers],
    ['Total Orders', orders.length],
    ['Total Sales', money(sales)],
    ["Today's Sales", money(today)],
    ['Low Stock', low],
    ['Out of Stock', inv.filter(i => i.stock === 0).length],
  ];
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <p className="gold font-bold">OVERVIEW</p>
          <h1 className="text-3xl sm:text-4xl font-black">Admin Dashboard</h1>
        </div>
        <Link href="/" className="btn btn-dark">View Store</Link>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(([a, b]) => <div key={a} className="card p-5"><p className="muted text-sm">{a}</p><p className="text-xl sm:text-2xl font-black mt-2">{b}</p></div>)}
      </div>
      <div className="card mt-8 p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
          <h2 className="text-2xl font-black">Recent Orders</h2>
          <Link href="/admin/orders" className="gold font-bold">Manage →</Link>
        </div>
        <div className="table-wrap mt-4">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{orders.slice(0, 8).map(o => <tr key={o.id}><td>{o.orderNumber}</td><td>{o.customerName}</td><td>{money(o.total)}</td><td><span className="badge">{o.status}</span></td><td>{new Date(o.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}