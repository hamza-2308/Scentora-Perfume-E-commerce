import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import SidebarToggle from '@/components/admin/SidebarToggle';
import { LayoutDashboard, Package, Tags, Store, Boxes, ShoppingCart, Users, BarChart3, Star, Shield, Settings } from 'lucide-react';

export default async function AdminLayout({ children }) {
  const u = await getUser();
  if (!u) redirect('/login');
  const links = [
    ['/admin', 'Dashboard', LayoutDashboard],
    ['/admin/products', 'Products', Package],
    ['/admin/categories', 'Categories', Tags],
    ['/admin/branches', 'Branches', Store],
    ['/admin/inventory', 'Inventory', Boxes],
    ['/admin/orders', 'Orders', ShoppingCart],
    ['/admin/customers', 'Customers', Users],
    ['/admin/analytics', 'Sales Analytics', BarChart3],
    ['/admin/reviews', 'Reviews', Star],
    ['/admin/users', 'Users & Roles', Shield],
    ['/admin/settings', 'Settings', Settings],
  ];
  return (
    <div className="admin-shell grid lg:grid-cols-[250px_1fr]">
      <aside className="admin-sidebar p-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-widest">SCENT<span className="gold">ORA</span></Link>
          <SidebarToggle />
        </div>
        <p className="text-xs text-stone-500 mt-2">{u.email} · {u.role}</p>
        <nav className="sidebar-nav grid gap-1 mt-8">
          {links.map(([href, label, I]) => (
            <Link key={href} href={href} className="sidebar-link flex gap-3 items-center">
              <I size={17} />{label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="p-5 md:p-8 overflow-x-auto">{children}</section>
    </div>
  );
}