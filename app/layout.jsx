'use client';
import './globals.css';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingBag, MapPin, UserCircle, Menu, X } from 'lucide-react';
import { CartProvider } from '@/components/shop/CartProvider';

export default function RootLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <html lang="en">
      <body>
        <CartProvider>
          <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
            <div className="container flex items-center justify-between h-20">
              <Link href="/" className="text-2xl font-black tracking-widest">
                SCENT<span className="gold">ORA</span>
              </Link>
              <nav className="hidden md:flex gap-7 text-sm font-semibold">
                <Link href="/">Home</Link>
                <Link href="/shop">Shop</Link>
                <Link href="/categories">Categories</Link>
                <Link href="/branches">Branches</Link>
                <Link href="/about">About</Link>
                <Link href="/contact">Contact</Link>
              </nav>
              <div className="flex gap-4 items-center">
                <Link href="/branches"><MapPin size={20} /></Link>
                <Link href="/account"><UserCircle size={21} /></Link>
                <Link href="/cart"><ShoppingBag size={21} /></Link>
                <button
                  className="md:hidden p-2 -mr-2"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Toggle menu"
                >
                  {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
            {menuOpen && (
              <nav className="md:hidden bg-white border-t border-stone-200 py-4">
                <div className="container grid gap-3 text-sm font-semibold">
                  <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
                  <Link href="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
                  <Link href="/categories" onClick={() => setMenuOpen(false)}>Categories</Link>
                  <Link href="/branches" onClick={() => setMenuOpen(false)}>Branches</Link>
                  <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
                  <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
                </div>
              </nav>
            )}
          </header>
          {children}
          <footer className="bg-[#17120f] text-white mt-16">
            <div className="container py-14 grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-2xl font-black tracking-widest">SCENT<span className="gold">ORA</span></div>
                <p className="text-stone-400 mt-3">Modern fragrances crafted for memorable moments.</p>
              </div>
              <div>
                <h4 className="font-bold mb-3">Explore</h4>
                <div className="grid gap-2 text-stone-400">
                  <Link href="/shop">Shop</Link>
                  <Link href="/categories">Categories</Link>
                  <Link href="/branches">Branches</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-3">Support</h4>
                <div className="grid gap-2 text-stone-400">
                  <Link href="/contact">Contact</Link>
                  <Link href="/account">My Account</Link>
                  <Link href="/orders">Order History</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-3">Newsletter</h4>
                <p className="text-stone-400 mb-3">Get launches and exclusive offers.</p>
                <input className="input" placeholder="Email address" />
              </div>
            </div>
            <div className="border-t border-stone-800 py-5 text-center text-stone-500">© 2026 Scentora. All rights reserved.</div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}