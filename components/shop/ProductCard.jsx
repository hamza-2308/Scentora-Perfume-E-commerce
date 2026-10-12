import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingBag } from 'lucide-react';
import { money } from '@/lib/utils';
import AddToCartButton from '@/components/shop/AddToCartButton';

export default function ProductCard({ p }) {
  const price = Number(p.price) * (1 - Number(p.discount) / 100);
  return (
    <div className="card group">
      <div className="relative aspect-square bg-stone-100">
        <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width:768px) 50vw, 25vw" />
        {p.newArrival && <span className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-xs font-bold">NEW</span>}
      </div>
      <div className="p-4">
        <div className="flex justify-between gap-2">
          <h3 className="font-bold text-sm sm:text-base">{p.name}</h3>
          <span className="gold font-bold text-sm sm:text-base">{money(price)}</span>
        </div>
        <p className="muted text-xs sm:text-sm mt-1">{p.size} · {p.fragranceType}</p>
        <div className="flex items-center gap-1 mt-2 text-sm"><Star size={15} fill="currentColor" className="gold" />{p.rating.toFixed(1)}</div>
        <Link href={`/product/${p.id}`} className="btn btn-dark w-full mt-4"><ShoppingBag size={16} /> <span className="ml-2">View Product</span></Link>
        <AddToCartButton productId={p.id} />
      </div>
    </div>
  );
}