'use client';
import { useEffect, useState } from 'react';

export default function Branches() {
  const [rows, setRows] = useState([]), [f, setF] = useState({ name: '', address: '', city: '', phone: '', openingHours: '10:00 AM', closingHours: '10:00 PM', managerName: '' });
  const load = () => fetch('/api/branches').then(x => x.json()).then(setRows);
  useEffect(() => { load() }, []);
  async function add(e) { e.preventDefault(); await fetch('/api/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); setF({ ...f, name: '', address: '', city: '', phone: '', managerName: '' }); load(); }
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black">Branches</h1>
      <form onSubmit={add} className="card p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
        {Object.keys(f).map(k => <input key={k} required={['name', 'address', 'city', 'phone'].includes(k)} className="input" placeholder={k} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />)}
        <button className="btn btn-gold">Add Branch</button>
      </form>
      <div className="card p-6 mt-6 table-wrap">
        <table className="table">
          <thead><tr><th>Branch</th><th>City</th><th>Manager</th><th>Products</th><th>Orders</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.city}</td><td>{r.managerName}</td><td>{r.inventories?.length}</td><td>{r._count?.orders}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}