'use client';
import { useEffect, useState } from 'react';

export default function Users() {
  const [rows, setRows] = useState([]), [branches, setBranches] = useState([]), [f, setF] = useState({ name: '', email: '', password: 'Admin@123', role: 'STAFF', branchId: '' });
  const load = () => fetch('/api/users').then(x => x.json()).then(setRows);
  useEffect(() => { load(); fetch('/api/branches').then(x => x.json()).then(setBranches) }, []);
  async function add(e) { e.preventDefault(); await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); setF({ ...f, name: '', email: '' }); load(); }
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black">Users & Roles</h1>
      <form onSubmit={add} className="card p-6 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-8">
        <input className="input" placeholder="Name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input className="input" placeholder="Email" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <input className="input" placeholder="Password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        <select className="input" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>{['SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF'].map(x => <option key={x}>{x}</option>)}</select>
        <select className="input" value={f.branchId} onChange={e => setF({ ...f, branchId: e.target.value })}><option value="">No branch</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <button className="btn btn-gold sm:col-span-2 lg:col-span-5">Create User</button>
      </form>
      <div className="card p-6 mt-6 table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Branch</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.email}</td><td>{r.role}</td><td>{r.branch?.name || '—'}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}