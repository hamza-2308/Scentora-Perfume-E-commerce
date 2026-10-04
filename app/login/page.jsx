'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('admin@scentora.com'), [password, setPassword] = useState('Admin@123'), [error, setError] = useState('');
  const r = useRouter();
  async function submit(e) {
    e.preventDefault();
    setError('');
    const x = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const d = await x.json();
    if (!x.ok) return setError(d.error);
    r.push('/admin');
  }
  return (
    <main className="min-h-[75vh] grid place-items-center p-4">
      <form onSubmit={submit} className="card p-8 w-full max-w-[430px]">
        <p className="gold font-bold">ADMIN ACCESS</p>
        <h1 className="text-3xl font-black mt-1">Scentora Dashboard</h1>
        <div className="grid gap-4 mt-6">
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn btn-dark">Sign In</button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
        <p className="muted text-xs mt-5">Demo: admin@scentora.com / Admin@123</p>
      </form>
    </main>
  );
}