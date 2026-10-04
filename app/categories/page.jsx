import Link from 'next/link';
import { db } from '@/lib/db';

export default async function Categories() {
  const cs = await db.category.findMany({ where: { active: true }, include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
  return (
    <main className="section">
      <div className="container">
        <p className="gold font-bold">COLLECTIONS</p>
        <h1 className="text-3xl sm:text-5xl font-black mb-10">Perfume Categories</h1>
        <div className="grid-auto">
          {cs.map(c => <Link key={c.id} href={`/shop?category=${c.slug}`} className="card p-8"><h2 className="text-2xl font-black">{c.name}</h2><p className="muted mt-3">{c._count.products} perfumes</p><span className="gold font-bold block mt-6">Explore →</span></Link>)}
        </div>
      </div>
    </main>
  );
}