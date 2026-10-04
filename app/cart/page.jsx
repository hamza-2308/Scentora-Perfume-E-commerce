'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/components/shop/CartProvider';
import { money } from '@/lib/utils';

export default function Cart() {
  const { items, remove, qty, total } = useCart();
  return (
    <main className="section">
      <div className="container">
        <h1 className="text-3xl sm:text-5xl font-black mb-10">Your Cart</h1>
        {!items.length ? (
          <div className="text-center py-20">
            <p className="muted">Your cart is empty.</p>
            <Link href="/shop" className="btn btn-dark mt-5">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid gap-4">
              {items.map(i => (
                <div key={i.id} className="card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="relative w-full sm:w-24 h-40 sm:h-24 rounded-xl overflow-hidden shrink-0">
                    <Image src={i.imageUrl} alt={i.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{i.name}</h3>
                    <p className="gold">{money(i.price * (1 - i.discount / 100))}</p>
                    <input className="input w-24 mt-2" type="number" min="1" value={i.qty} onChange={e => qty(i.id, Number(e.target.value))} />
                  </div>
                  <button onClick={() => remove(i.id)} className="p-2"><Trash2 /></button>
                </div>
              ))}
            </div>
            <div className="card p-6 h-fit">
              <h2 className="text-2xl font-black">Summary</h2>
              <div className="flex justify-between mt-6"><span>Subtotal</span><b>{money(total)}</b></div>
              <div className="flex justify-between mt-2"><span>Shipping</span><b>Free</b></div>
              <div className="border-t mt-5 pt-5 flex justify-between text-xl"><span>Total</span><b>{money(total)}</b></div>
              <Link href="/checkout" className="btn btn-gold w-full mt-6">Checkout</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}