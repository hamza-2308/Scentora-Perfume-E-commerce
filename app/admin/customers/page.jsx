'use client';
import { useEffect, useState } from 'react';

export default function Customers() {
  const [rows, setRows] = useState([]);
  useEffect(() => { fetch('/api/customers').then(x => x.json()).then(setRows) }, []);
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black">Customers</h1>
      <div className="card p-6 mt-8 table-wrap">
        <table className="table">
          <thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Last Order</th><th>Status</th></tr></thead>
          <tbody>{rows.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.email}<br />{c.phone}</td><td>{c._count.orders}</td><td>{c.orders[0] ? new Date(c.orders[0].createdAt).toLocaleDateString() : '—'}</td><td>{c.active ? 'Active' : 'Inactive'}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}