export default function About() {
  return (
    <main className="section">
      <div className="container max-w-4xl">
        <p className="gold font-bold">OUR STORY</p>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mt-2">Fragrance is personal. We make it unforgettable.</h1>
        <p className="muted text-base sm:text-xl leading-9 mt-8">Scentora is a fictional modern perfume house created around the idea that a great fragrance should feel like an extension of who you are. Our collections move from fresh everyday scents to deep oud and luxurious oriental blends.</p>
        <div className="grid sm:grid-cols-3 gap-5 mt-12">
          <div className="card p-6"><b>Craft</b><p className="muted mt-2">Balanced fragrance profiles and memorable notes.</p></div>
          <div className="card p-6"><b>Choice</b><p className="muted mt-2">Collections for men, women and unisex wear.</p></div>
          <div className="card p-6"><b>Access</b><p className="muted mt-2">Multiple physical branches with live availability.</p></div>
        </div>
      </div>
    </main>
  );
}