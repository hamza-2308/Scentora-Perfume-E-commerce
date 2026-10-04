'use client';
import { useEffect, useState } from 'react';
import { money } from '@/lib/utils';

export default function Orders() {
  const [rows, setRows] = useState([]);
  const load = () => fetch('/api/orders').then(x => x.json()).then(setRows);
  useEffect(() => { load() }, []);
  async function status(id, status) { await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); load(); }
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black">Orders</h1>
      <p className="muted mt-2">Every customer order appears here automatically.</p>
      <div className="card p-6 mt-8 table-wrap">
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Branch</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
          <tbody>{rows.map(o => <tr key={o.id}><td>{o.orderNumber}</td><td>{o.customerName}<br /><small>{o.customerEmail}</small></td><td>{o.branch.name}</td><td>{money(o.total)}</td><td>{o.paymentStatus}</td><td><select className="input" value={o.status} onChange={e => status(o.id, e.target.value)}>{['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}