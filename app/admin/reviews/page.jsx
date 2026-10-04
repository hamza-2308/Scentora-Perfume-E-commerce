'use client';
import { useEffect, useState } from 'react';

export default function Reviews() {
  const [rows, setRows] = useState([]);
  const load = () => fetch('/api/reviews').then(x => x.json()).then(setRows);
  useEffect(() => { load() }, []);
  async function toggle(r) { await fetch('/api/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, approved: !r.approved }) }); load(); }
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black">Reviews</h1>
      <div className="card p-6 mt-8 table-wrap">
        <table className="table">
          <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Status</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.id}><td>{r.product.name}</td><td>{r.customer.name}</td><td>★ {r.rating}</td><td>{r.comment}</td><td><button className="btn btn-dark py-1 px-3" onClick={() => toggle(r)}>{r.approved ? 'Approved' : 'Hidden'}</button></td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}