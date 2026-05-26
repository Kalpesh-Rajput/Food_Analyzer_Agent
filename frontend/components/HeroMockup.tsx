"use client";

import { motion } from 'framer-motion';
import { Camera, FileText, ShieldCheck, Sparkles } from 'lucide-react';

export default function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-500/15 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[44px] border border-white/10 bg-slate-900/85 p-5 shadow-[0_60px_120px_rgba(0,0,0,0.3)]"
      >
        <div className="mb-4 flex items-center justify-between rounded-3xl bg-slate-950/80 px-4 py-3 text-sm text-slate-400 shadow-inner shadow-black/5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            AI Scan active
          </div>
          <span className="rounded-full bg-slate-800/90 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-400">Live</span>
        </div>
        <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800/90 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
          <div className="flex items-center justify-between gap-4 rounded-[28px] bg-slate-900/90 p-4 ring-1 ring-white/5">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Product</p>
              <p className="mt-3 text-lg font-semibold text-slate-100">Cereal Bars</p>
            </div>
            <div className="rounded-3xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">Scan</div>
          </div>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
                <span>Ingredients</span>
                <span>Complete</span>
              </div>
              <div className="space-y-3 text-sm text-slate-200">
                <p>Whole grain oats, honey, soy protein isolate, brown sugar, palm oil.</p>
                <p>High fructose corn syrup, natural flavor, soy lecithin, salt.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-900/80 p-4 text-center">
                <p className="text-2xl font-semibold text-slate-100">72</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-slate-500">Health</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-4 text-center">
                <p className="text-2xl font-semibold text-amber-300">3 tsp</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-slate-500">Sugar</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-4 text-center">
                <p className="text-2xl font-semibold text-slate-100">High</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-slate-500">Process</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="pointer-events-none absolute -bottom-4 left-1/2 h-28 w-80 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500/10 via-transparent to-sky-500/5 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.9 }}
        className="mt-8 grid gap-4"
      >
        <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 p-5 shadow-[0_35px_70px_rgba(0,0,0,0.25)] transition hover:-translate-y-1">
          <div className="flex items-center gap-3 text-sm text-emerald-300">
            <span className="rounded-full bg-emerald-500/15 p-2 text-emerald-300"><Camera size={16} /></span>
            Scan food label
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">Auto-capture package details and highlight hidden sugars in a flash.</p>
        </div>
        <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 p-5 shadow-[0_35px_70px_rgba(0,0,0,0.25)] transition hover:-translate-y-1">
          <div className="flex items-center gap-3 text-sm text-sky-300">
            <span className="rounded-full bg-sky-500/15 p-2 text-sky-300"><FileText size={16} /></span>
            AI label analysis
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">Intelligent parsing of ingredients, macros, additives and processing level.</p>
        </div>
        <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 p-5 shadow-[0_35px_70px_rgba(0,0,0,0.25)] transition hover:-translate-y-1">
          <div className="flex items-center gap-3 text-sm text-amber-300">
            <span className="rounded-full bg-amber-500/15 p-2 text-amber-300"><ShieldCheck size={16} /></span>
            Honest verdict
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">Fast feedback with clear recommendations for every grocery decision.</p>
        </div>
      </motion.div>
    </div>
  );
}
