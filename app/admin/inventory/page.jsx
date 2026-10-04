'use client';
import { useEffect, useState } from 'react';

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const load = () => fetch('/api/inventory').then(x => x.json()).then(setRows);
  useEffect(() => { load() }, []);
  async function update(id, stock) { await fetch('/api/inventory', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, stock }) }); load(); }
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black">Inventory Management</h1>
      <p className="muted mt-2">Branch-wise stock, low-stock alerts and inventory updates.</p>
      <div className="card p-6 mt-8 table-wrap">
        <table className="table">
          <thead><tr><th>Product</th><th>Branch</th><th>Stock</th><th>Threshold</th><th>Action</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.id}><td>{r.product.name}</td><td>{r.branch.name}</td><td className={r.stock === 0 ? 'text-red-600 font-bold' : r.stock <= r.lowStockThreshold ? 'gold font-bold' : ''}>{r.stock}</td><td>{r.lowStockThreshold}</td><td><button className="btn btn-dark py-1 px-3" onClick={() => { const s = prompt('New stock', r.stock); if (s !== null) update(r.id, s); }}>Update</button></td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}