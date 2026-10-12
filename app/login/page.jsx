'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/components/shop/CartProvider';
import GoogleButton from '@/components/auth/GoogleButton';

function LoginForm() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('admin@scentora.com'), [password, setPassword] = useState('Admin@123'), [error, setError] = useState('');
  const [name, setName] = useState('');
  const r = useRouter();
  const sp = useSearchParams();
  const { addToCart, refreshUser } = useCart();
  const rawRedirect = sp.get('redirect') || '/';
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';
  const pendingProduct = sp.get('action') === 'add-to-cart' ? sp.get('productId') : null;
  const pendingQty = Number(sp.get('quantity') || 1);
  const message = sp.get('message');
  const oauthError = sp.get('error');
  async function submit(e) {
    e.preventDefault();
    setError('');
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = mode === 'login' ? { email, password } : { name, email, password };
    const x = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await x.json();
    if (!x.ok) return setError(d.error || (mode === 'login' ? 'Login failed' : 'Signup failed'));
    await refreshUser();
    if (pendingProduct) await addToCart(pendingProduct, pendingQty, { noRedirect: true });
    if (d.user?.role && d.user.role !== 'CUSTOMER') {
      r.push('/admin');
    } else {
      r.push(redirect);
    }
  }
  return (
    <main className="min-h-[75vh] grid place-items-center p-4">
      <form onSubmit={submit} className="card p-8 w-full max-w-[430px]">
        <p className="gold font-bold">{mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</p>
        <h1 className="text-3xl font-black mt-1">{mode === 'login' ? 'Sign in to Scentora' : 'Join Scentora'}</h1>
        {message && <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm mt-4">{message}</p>}
        {oauthError && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm mt-4">{oauthError}</p>}
        {/* <div className="mt-6">
          <GoogleButton redirect={redirect} />
        </div> */}
        <div className="flex items-center gap-3 my-5">
          <span className="h-px flex-1 bg-stone-200"></span>
          <span className="muted text-xs font-bold">OR</span>
          <span className="h-px flex-1 bg-stone-200"></span>
        </div>
        <div className="grid gap-4">
          {mode === 'signup' && <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />}
          <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="btn btn-dark">{mode === 'login' ? 'Sign In' : 'Create Account'}</button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
        <p className="muted text-xs mt-5">
          {mode === 'login' ? (
            <>New to Scentora? <button type="button" className="gold font-bold underline" onClick={() => { setMode('signup'); setError(''); }}>Create an account</button></>
          ) : (
            <>Already have an account? <button type="button" className="gold font-bold underline" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
          )}
        </p>
        {/* {mode === 'login' && <p className="muted text-xs mt-3">Demo: admin@scentora.com / Admin@123</p>} */}
      </form>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}