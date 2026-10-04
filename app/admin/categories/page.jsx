'use client';
import { useEffect, useState } from 'react';

export default function Categories() {
  const [rows, setRows] = useState([]), [name, setName] = useState('');
  const load = () => fetch('/api/categories').then(x => x.json()).then(setRows);
  useEffect(() => { load() }, []);
  async function add(e) { e.preventDefault(); await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }) }); setName(''); load(); }
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black">Categories</h1>
      <form onSubmit={add} className="flex flex-col sm:flex-row gap-3 mt-8 max-w-xl">
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Category name" required />
        <button className="btn btn-gold">Add</button>
      </form>
      <div className="card p-6 mt-6 table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Products</th><th>Status</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.id}><td>{r.name}</td><td>{r._count?.products}</td><td>{r.active ? 'Active' : 'Inactive'}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}