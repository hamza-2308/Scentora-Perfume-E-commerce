import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { money } from '@/lib/utils';
import AddToCart from './add-to-cart';

export default async function Product({ params }) {
  const { id } = await params;
  const p = await db.product.findUnique({ where: { id }, include: { category: true, inventories: { include: { branch: true } } } });
  if (!p) notFound();
  const price = Number(p.price) * (1 - Number(p.discount) / 100);
  return (
    <main className="section">
      <div className="container grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-100">
          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
        </div>
        <div className="py-5">
          <p className="gold font-bold">{p.category.name}</p>
          <h1 className="text-3xl sm:text-5xl font-black mt-2">{p.name}</h1>
          <div className="flex items-center gap-2 mt-4">★ {p.rating.toFixed(1)} <span className="muted">({p.reviewCount} reviews)</span></div>
          <div className="flex items-end gap-3 mt-7">
            <span className="text-2xl sm:text-3xl font-black">{money(price)}</span>
            {Number(p.discount) > 0 && <><del className="muted">{money(p.price)}</del><span className="gold font-bold">{Number(p.discount)}% OFF</span></>}
          </div>
          <p className="muted text-base sm:text-lg mt-6 leading-8">{p.description}</p>
          <div className="grid grid-cols-2 gap-3 mt-7">
            <div className="card p-4"><b>Size</b><p className="muted">{p.size}</p></div>
            <div className="card p-4"><b>Gender</b><p className="muted">{p.gender}</p></div>
            <div className="card p-4"><b>Fragrance</b><p className="muted">{p.fragranceType}</p></div>
            <div className="card p-4"><b>Notes</b><p className="muted">{p.notes}</p></div>
          </div>
          <AddToCart p={{ id: p.id, name: p.name, price: Number(p.price), discount: Number(p.discount), imageUrl: p.imageUrl }} />
          <h3 className="font-black text-xl mt-10 mb-4">Branch Availability</h3>
          <div className="grid gap-2">
            {p.inventories.map(i => <div key={i.id} className="flex justify-between border-b py-2"><span>{i.branch.name}</span><span className={i.stock ? 'gold font-bold' : 'text-red-600'}>{i.stock ? `${i.stock} in stock` : 'Out of stock'}</span></div>)}
          </div>
        </div>
      </div>
    </main>
  );
}