import Link from 'next/link';
import Navbar from '../../components/Navbar';
import LiveDemo from '../../components/LiveDemo';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Demo | NutriLens AI',
  description: 'Try the NutriLens AI food label demo and see live analysis in action.',
};

export default function DemoPage() {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <section className="relative px-6 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Live demo</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-5xl">Experience NutriLens AI in a dedicated demo flow.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400">Upload food labels, capture packaging, and watch the AI identify hidden sugar, additives, and nutrient risks with premium detail.</p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400 hover:bg-white/10">
              Back to landing
            </Link>
          </div>
        </div>
      </section>
      <section className="px-6 pb-28 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <LiveDemo />
        </div>
      </section>
      <Footer />
    </main>
  );
}
