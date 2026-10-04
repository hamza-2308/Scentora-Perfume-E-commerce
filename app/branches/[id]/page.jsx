import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import ProductCard from '@/components/shop/ProductCard';

export default async function Branch({ params }) {
  const { id } = await params;
  const b = await db.branch.findUnique({ where: { id }, include: { inventories: { include: { product: true, branch: true } } } });
  if (!b) notFound();
  const available = b.inventories.filter(i => i.stock > 0);
  return (
    <main className="section">
      <div className="container">
        <p className="gold font-bold">STORE DETAILS</p>
        <h1 className="text-3xl sm:text-5xl font-black">{b.name}</h1>
        <p className="muted text-base sm:text-lg mt-3">{b.address} · {b.city}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="card p-5"><b>Total Products</b><p className="text-2xl font-black">{b.inventories.length}</p></div>
          <div className="card p-5"><b>Available</b><p className="text-2xl font-black">{available.length}</p></div>
          <div className="card p-5"><b>Out of Stock</b><p className="text-2xl font-black">{b.inventories.length - available.length}</p></div>
          <div className="card p-5"><b>Sales Orders</b><p className="text-2xl font-black">{await db.order.count({ where: { branchId: id } })}</p></div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black mt-14 mb-7">Available Perfumes</h2>
        <div className="grid-auto">{available.map(i => <ProductCard key={i.product.id} p={i.product} />)}</div>
      </div>
    </main>
  );
}