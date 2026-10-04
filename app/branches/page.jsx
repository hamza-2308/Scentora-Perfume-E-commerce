import Link from 'next/link';
import { db } from '@/lib/db';

export default async function Branches() {
  const bs = await db.branch.findMany({ where: { active: true }, include: { inventories: { include: { product: true } }, _count: { select: { orders: true } } } });
  return (
    <main className="section">
      <div className="container">
        <p className="gold font-bold">FIND A STORE</p>
        <h1 className="text-3xl sm:text-5xl font-black mb-10">Scentora Branches</h1>
        <div className="grid-auto">
          {bs.map(b => {
            const total = b.inventories.length, available = b.inventories.filter(i => i.stock > 0).length;
            return <Link key={b.id} href={`/branches/${b.id}`} className="card p-7"><h2 className="text-2xl font-black">{b.name}</h2><p className="muted mt-2">{b.address}</p><p className="mt-5">{b.phone}</p><p className="muted">{b.openingHours} – {b.closingHours}</p><div className="mt-6 flex gap-4 text-sm"><span>{total} products</span><span className="gold font-bold">{available} available</span></div></Link>;
          })}
        </div>
      </div>
    </main>
  );
}