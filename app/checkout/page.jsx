'use client';
import { useState } from 'react';
import { useCart } from '@/components/shop/CartProvider';
import { money } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function Checkout() {
  const { items, total } = useCart();
  const r = useRouter();
  const [f, setF] = useState({ name: '', email: '', phone: '', address: '', city: 'Islamabad' });
  const [loading, setLoading] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: { ...f }, items }) });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) return alert(d.error);
    localStorage.removeItem('scentora-cart');
    r.push(`/orders?success=${d.orderNumber}`);
  };
  return (
    <main className="section">
      <div className="container max-w-5xl">
        <p className="gold font-bold">CHECKOUT</p>
        <h1 className="text-3xl sm:text-5xl font-black mb-10">Complete your order</h1>
        {!items.length ? (
          <p>Your cart is empty.</p>
        ) : (
          <form onSubmit={submit} className="grid md:grid-cols-2 gap-8">
            <div className="card p-7 grid gap-4">
              <input required className="input" placeholder="Full name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
              <input required type="email" className="input" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
              <input required className="input" placeholder="Phone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
              <textarea required className="input" placeholder="Delivery address" value={f.address} onChange={e => setF({ ...f, address: e.target.value })} />
              <select className="input" value={f.city} onChange={e => setF({ ...f, city: e.target.value })}>
                {['Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Peshawar', 'Faisalabad'].map(x => <option key={x}>{x}</option>)}
              </select>
              <button disabled={loading} className="btn btn-gold">{loading ? 'Placing order...' : 'Place Order'}</button>
            </div>
            <div className="card p-7 h-fit">
              <h2 className="text-2xl font-black">Order Summary</h2>
              {items.map(i => <div key={i.id} className="flex justify-between py-3 border-b"><span>{i.name} × {i.qty}</span><b>{money(i.price * (1 - i.discount / 100) * i.qty)}</b></div>)}
              <div className="flex justify-between mt-6 text-xl"><b>Total</b><b>{money(total)}</b></div>
              <p className="muted text-sm mt-4">Payment status starts as pending. Admin can update order/payment status from the dashboard.</p>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}