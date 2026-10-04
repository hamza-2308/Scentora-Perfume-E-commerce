export default function Contact() {
  return (
    <main className="section">
      <div className="container grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <p className="gold font-bold">GET IN TOUCH</p>
          <h1 className="text-3xl sm:text-5xl font-black">Contact Scentora</h1>
          <p className="muted text-base sm:text-lg mt-5">Have a question about a fragrance, branch or order? Send us a message.</p>
          <div className="mt-8 grid gap-3">
            <p>📞 +92 300 1234567</p>
            <p>✉️ hello@scentora.com</p>
            <p>📍 Islamabad, Pakistan</p>
          </div>
        </div>
        <form className="card p-7 grid gap-4">
          <input className="input" placeholder="Your name" />
          <input className="input" placeholder="Email" type="email" />
          <input className="input" placeholder="Subject" />
          <textarea className="input min-h-36" placeholder="Message" />
          <button className="btn btn-dark">Send Message</button>
        </form>
      </div>
    </main>
  );
}