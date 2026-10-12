'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/shop/CartProvider';

function Avatar({ user }) {
  if (user?.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar} alt="" width={30} height={30} className="rounded-full object-cover" referrerPolicy="no-referrer" />;
  }
  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
  return <span className="grid place-items-center rounded-full bg-[#17120f] text-white text-xs font-bold" style={{ width: 30, height: 30 }}>{initial}</span>;
}

// Header account control: shows the signed-in customer's name/avatar with a
// logout action, or a "Sign in" link for guests. Reuses the shared user state.
export default function AccountMenu() {
  const { user, refreshUser } = useCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function logout() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      // Only treat it as signed out when the server actually cleared the cookie.
      if (!res.ok) {
        setError('Could not sign out on the server. Please try again.');
        return;
      }
    } catch {
      // Network-level failure (e.g. "Failed to fetch": server unreachable).
      // Do NOT claim the session was revoked — the cookie may still be valid.
      setError('Network error — could not reach the server to sign out. Please try again.');
      return;
    } finally {
      setBusy(false);
    }
    // Reached only after the server confirmed the session cookie was cleared.
    await refreshUser();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  // Still resolving the session.
  if (user === undefined) return <span style={{ width: 30, height: 30 }} />;

  // Guest.
  if (user === null) {
    return (
      <a href="/login" className="text-sm font-bold gold" aria-label="Sign in">
        Sign in
      </a>
    );
  }

  const label = user.name || user.email;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar user={user} />
        <span className="hidden sm:inline text-sm font-semibold max-w-[120px] truncate">{label}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 card p-2 z-50" style={{ borderRadius: 14 }}>
          <div className="px-3 py-2 border-b border-stone-100">
            <p className="text-sm font-bold truncate">{user.name || 'Account'}</p>
            <p className="muted text-xs truncate">{user.email}</p>
          </div>
          <a href="/account" className="block px-3 py-2 text-sm hover:bg-stone-50 rounded-lg">My Account</a>
          <a href="/orders" className="block px-3 py-2 text-sm hover:bg-stone-50 rounded-lg">My Orders</a>
          {error && <p role="alert" className="px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-60"
          >
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
