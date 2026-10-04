import { db } from '@/lib/db';
import ProductCard from '@/components/shop/ProductCard';

export default async function Shop({ searchParams }) {
  const sp = await searchParams;
  const q = sp?.q || '';
  const category = sp?.category;
  const best = sp?.bestSeller === 'true';
  const fresh = sp?.newArrival === 'true';
  const [products, cats] = await Promise.all([
    db.product.findMany({
      where: {
        active: true,
        name: { contains: q, mode: 'insensitive' },
        ...(category ? { category: { slug: category } } : {}),
        ...(best ? { bestSeller: true } : {}),
        ...(fresh ? { newArrival: true } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.category.findMany({ where: { active: true } }),
  ]);
  return (
    <main className="section">
      <div className="container">
        <div className="mb-10">
          <p className="gold font-bold">SCENTORA COLLECTION</p>
          <h1 className="text-3xl sm:text-5xl font-black">Shop Perfumes</h1>
          <p className="muted mt-3">Search, discover and find your signature scent.</p>
        </div>
        <form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <input name="q" defaultValue={q} placeholder="Search perfume..." className="input sm:col-span-2" />
          <select name="category" defaultValue={category || ''} className="input">
            <option value="">All categories</option>
            {cats.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <button className="btn btn-dark">Search</button>
        </form>
        <div className="flex gap-2 mb-8 flex-wrap">
          <a className="badge" href="/shop">All</a>
          <a className="badge" href="/shop?bestSeller=true">Best Sellers</a>
          <a className="badge" href="/shop?newArrival=true">New Arrivals</a>
        </div>
        <div className="grid-auto">{products.map(p => <ProductCard key={p.id} p={p} />)}</div>
        {!products.length && <div className="text-center py-20 muted">No perfumes matched your search.</div>}
      </div>
    </main>
  );
}