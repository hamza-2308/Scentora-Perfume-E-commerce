import Link from 'next/link';

export default function Account() {
  return (
    <main className="section">
      <div className="container max-w-2xl text-center">
        <p className="gold font-bold">MY ACCOUNT</p>
        <h1 className="text-3xl sm:text-5xl font-black">Welcome to Scentora</h1>
        <p className="muted text-base sm:text-lg mt-5">Use order history to review recent purchases. Customer accounts can be extended with registration/JWT sessions as needed.</p>
        <Link href="/orders" className="btn btn-dark mt-7">View Order History</Link>
      </div>
    </main>
  );
}