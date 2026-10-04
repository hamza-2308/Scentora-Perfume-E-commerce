import { db } from '@/lib/db';

export default async function Settings() {
  const settings = await db.setting.findMany();
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black">Settings</h1>
      <div className="card p-6 mt-8 max-w-2xl">
        <h2 className="text-xl font-black">System Settings</h2>
        {settings.map(s => <div key={s.id} className="flex justify-between border-b py-4"><span>{s.key}</span><b>{s.value}</b></div>)}
      </div>
      <div className="card p-6 mt-6 max-w-2xl">
        <h2 className="text-xl font-black">Database</h2>
        <p className="muted mt-2">PostgreSQL via Prisma. Use <code>npx prisma db push</code> for development or migrations for production.</p>
      </div>
    </>
  );
}