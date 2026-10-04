'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Products() {
  const [ps, setPs] = useState([]), [cs, setCs] = useState([]), [f, setF] = useState({ name: '', slug: '', imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f', description: '', price: 3000, discount: 0, size: '100ml', gender: 'UNISEX', fragranceType: 'Fresh', notes: 'Citrus, Musk', categoryId: '', bestSeller: false, newArrival: false });
  const load = async () => { setPs(await (await fetch('/api/products')).json()); setCs(await (await fetch('/api/categories')).json()); };
  useEffect(() => { load() }, []);
  const submit = async e => {
    e.preventDefault();
    await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, slug: f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), price: Number(f.price), discount: Number(f.discount) }) });
    setF({ ...f, name: '', slug: '' });
    load();
  };
  const del = async id => { if (confirm('Delete product?')) { await fetch('/api/products/' + id, { method: 'DELETE' }); load(); } };
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black">Products</h1>
      <div className="grid xl:grid-cols-[380px_1fr] gap-6 mt-8">
        <form onSubmit={submit} className="card p-6 grid gap-3 h-fit">
          <h2 className="text-xl font-black">Add Product</h2>
          {[['name', 'Product name'], ['slug', 'Slug'], ['imageUrl', 'Image URL'], ['description', 'Description'], ['price', 'Price'], ['discount', 'Discount %'], ['size', 'Size'], ['fragranceType', 'Fragrance type'], ['notes', 'Fragrance notes']].map(([k, p]) => <input key={k} required={['name', 'imageUrl', 'description', 'price', 'size'].includes(k)} className="input" placeholder={p} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />)}
          <select className="input" value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })}>{['MEN', 'WOMEN', 'UNISEX'].map(x => <option key={x}>{x}</option>)}</select>
          <select required className="input" value={f.categoryId} onChange={e => setF({ ...f, categoryId: e.target.value })}><option value="">Category</option>{cs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <label><input type="checkbox" checked={f.bestSeller} onChange={e => setF({ ...f, bestSeller: e.target.checked })} /> Best Seller</label>
          <label><input type="checkbox" checked={f.newArrival} onChange={e => setF({ ...f, newArrival: e.target.checked })} /> New Arrival</label>
          <button className="btn btn-gold">Add Product</button>
        </form>
        <div className="card p-6 table-wrap">
          <table className="table">
            <thead><tr><th>Product</th><th>Price</th><th>Category</th><th>Status</th><th></th></tr></thead>
            <tbody>{ps.map(p => <tr key={p.id}><td className="flex items-center gap-3"><Image src={p.imageUrl} width={45} height={45} alt="" className="rounded" />{p.name}</td><td>Rs. {Number(p.price).toLocaleString()}</td><td>{p.category?.name}</td><td>{p.active ? 'Active' : 'Inactive'}</td><td><button className="text-red-600" onClick={() => del(p.id)}>Delete</button></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}