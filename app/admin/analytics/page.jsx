'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { money } from '@/lib/utils';

export default function Analytics() {
  const [d, setD] = useState(null);
  useEffect(() => { fetch('/api/analytics').then(x => x.json()).then(setD) }, []);
  if (!d) return <p>Loading analytics...</p>;
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black">Sales Analytics</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="card p-5"><p className="muted">Revenue</p><b className="text-xl sm:text-2xl">{money(d.total)}</b></div>
        <div className="card p-5"><p className="muted">Today</p><b className="text-xl sm:text-2xl">{money(d.todaySales)}</b></div>
        <div className="card p-5"><p className="muted">Low Stock</p><b className="text-xl sm:text-2xl">{d.lowStock}</b></div>
        <div className="card p-5"><p className="muted">Out of Stock</p><b className="text-xl sm:text-2xl">{d.outOfStock}</b></div>
      </div>
      <div className="card p-6 mt-8">
        <h2 className="text-xl font-black mb-5">Best-Selling Perfumes</h2>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={d.top}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="units" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}