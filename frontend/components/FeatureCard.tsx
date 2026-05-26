"use client";

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export default function FeatureCard({ icon: Icon, title, description, index }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: 0.08 * index, duration: 0.6 }}
      className="group rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_35px_100px_rgba(255,255,255,0.04)] transition hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-slate-900/80"
    >
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-300/10 transition group-hover:bg-emerald-500/15">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p>
    </motion.article>
  );
}
