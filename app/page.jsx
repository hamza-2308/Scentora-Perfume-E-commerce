import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import ProductCard from '@/components/shop/ProductCard';

export default async function Home() {
  const [featured, best, cats, branches] = await Promise.all([
    db.product.findMany({ where: { active: true, newArrival: true }, take: 4 }),
    db.product.findMany({ where: { active: true, bestSeller: true }, take: 4 }),
    db.category.findMany({ where: { active: true }, take: 6 }),
    db.branch.findMany({ where: { active: true }, take: 3 }),
  ]);
  return (
    <>
      <section className="hero text-white">
        <div className="container min-h-[420px] md:min-h-[560px] flex items-center">
          <div className="max-w-2xl">
            <p className="uppercase tracking-[.35em] gold font-bold">The Scent of Confidence</p>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black mt-4 leading-tight">Find the fragrance that becomes your signature.</h1>
            <p className="text-stone-200 text-base sm:text-lg mt-6">Discover modern perfumes, timeless oud and expressive blends available across Scentora branches.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link href="/shop" className="btn btn-gold">Shop Collection</Link>
              <Link href="/about" className="btn border border-white">Our Story</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-3">
            <div>
              <p className="gold font-bold">JUST ARRIVED</p>
              <h2 className="text-2xl sm:text-4xl font-black">New Arrivals</h2>
            </div>
            <Link href="/shop?newArrival=true" className="font-bold">View all →</Link>
          </div>
          <div className="grid-auto">{featured.map(p => <ProductCard key={p.id} p={p} />)}</div>
        </div>
      </section>
      <section className="bg-[#eee6d8] section">
        <div className="container">
          <p className="gold font-bold">EXPLORE</p>
          <h2 className="text-2xl sm:text-4xl font-black mb-8">Shop by Category</h2>
          <div className="grid-auto">{cats.map(c => <Link key={c.id} href={`/shop?category=${c.slug}`} className="card p-7 hover:-translate-y-1 transition"><h3 className="text-xl font-bold">{c.name}</h3><p className="muted mt-2">Discover the collection →</p></Link>)}</div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-3">
            <div>
              <p className="gold font-bold">CUSTOMER FAVOURITES</p>
              <h2 className="text-2xl sm:text-4xl font-black">Best Sellers</h2>
            </div>
            <Link href="/shop?bestSeller=true" className="font-bold">View all →</Link>
          </div>
          <div className="grid-auto">{best.map(p => <ProductCard key={p.id} p={p} />)}</div>
        </div>
      </section>
      <section className="bg-[#17120f] text-white section">
        <div className="container">
          <p className="gold font-bold">VISIT US</p>
          <h2 className="text-2xl sm:text-4xl font-black mb-8">Our Branches</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map(b => <Link key={b.id} href={`/branches/${b.id}`} className="border border-stone-700 rounded-2xl p-6 hover:border-[#b98b45]"><h3 className="text-xl font-bold">{b.name}</h3><p className="text-stone-400 mt-2">{b.address}</p><p className="gold mt-4">View branch →</p></Link>)}
          </div>
        </div>
      </section>
      <section className="section text-center">
        <div className="container max-w-3xl">
          <p className="gold font-bold">THE SCENTORA STORY</p>
          <h2 className="text-2xl sm:text-4xl font-black">A fragrance house built around individuality.</h2>
          <p className="muted text-base sm:text-lg mt-5">From bold oud to luminous florals, Scentora creates versatile fragrances for every mood and moment.</p>
          <Link href="/about" className="btn btn-dark mt-7">Discover our story</Link>
        </div>
      </section>
    </>
  );
}