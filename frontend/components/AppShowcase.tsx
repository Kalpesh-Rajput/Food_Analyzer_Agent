"use client";

import { motion } from 'framer-motion';
import { Camera, Sparkles, ShieldCheck, FileText } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

export default function AppShowcase() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.24 });

  return (
    <section ref={ref} className="relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : {} }
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
      >
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">App showcase</p>
            <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Animated scan flow that feels premium and precise.</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Live mobile preview with AI scan animation</div>
        </div>
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {} }
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.12 }}
            className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950/95 p-6 shadow-[0_40px_90px_rgba(0,0,0,0.25)]"
          >
            <div className="absolute left-4 top-4 rounded-full bg-emerald-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Scanning</div>
            <div className="rounded-[32px] bg-slate-900/95 p-5 ring-1 ring-white/5">
              <div className="mb-5 flex items-center justify-between text-sm text-slate-400">
                <span>NutriLens AI</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200">
                  <Camera size={12} /> Live feed
                </span>
              </div>
              <div className="mb-6 h-64 rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 shadow-inner shadow-black/20">
                <div className="relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90">
                  <div className="absolute inset-x-0 top-8 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-90 animate-[scanLine_2s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_35%,rgba(16,185,129,0.16),transparent_18%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.14),transparent_20%)]" />
                  <div className="absolute inset-x-0 bottom-8 mx-auto h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, label: 'OCR accuracy', value: '99%' },
                  { icon: FileText, label: 'Ingredient parsing', value: 'Instant' },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="mb-3 flex items-center gap-3 text-sm text-slate-400">
                      <item.icon size={16} />
                      <span>{item.label}</span>
                    </div>
                    <p className="text-2xl font-semibold text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {} }
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.18 }}
            className="space-y-6"
          >
            <div className="rounded-[36px] border border-white/10 bg-slate-900/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3 text-emerald-300">
                <Sparkles size={18} />
                <p className="text-sm uppercase tracking-[0.3em]">Verdict reveal</p>
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-100">AI scanning completes and reveals a verdict card with health highlights.</p>
              <div className="mt-6 rounded-[28px] bg-slate-950/80 p-5 text-slate-300">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Result</p>
                <p className="mt-3 text-xl font-semibold text-emerald-300">Ultra-processed snack detected</p>
                <p className="mt-2 text-sm leading-7">Sugar equivalent to 3 tsp, high sodium, and artificial flavors flagged.</p>
              </div>
            </div>
            <div className="rounded-[36px] border border-white/10 bg-slate-900/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3 text-slate-300">
                <span className="rounded-2xl bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-300">Pulse</span>
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-100">Interactive chat preview</p>
              <div className="mt-6 space-y-4 rounded-[28px] bg-slate-950/80 p-5">
                <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-4">
                  <p className="text-sm text-slate-300">This product is basically ultra-processed. You’ll need ~20 mins walking to burn it.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-4">
                  <p className="text-sm text-slate-300">Hidden sugar, high sodium, and artificial flavors detected in the ingredient list.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
