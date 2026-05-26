"use client";

import { motion } from 'framer-motion';

interface ResponseProps {
  response: {
    label: string;
    tone: 'danger' | 'warning' | 'success';
    bullets: string[];
    verdict: string;
  };
  index: number;
}

const toneStyles = {
  danger: 'bg-[#7f1d1d]/15 border-[#f87171]/20 text-[#f87171]',
  warning: 'bg-[#78350f]/15 border-[#f59e0b]/20 text-[#f59e0b]',
  success: 'bg-[#064e3b]/15 border-[#10b981]/20 text-[#10b981]',
};

export default function ResponseCard({ response, index }: ResponseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="rounded-[32px] border border-white/10 bg-slate-900/95 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
    >
      <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${toneStyles[response.tone]}`}>
        {response.label}
      </div>
      <div className="mt-6 space-y-3">
        {response.bullets.map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
            <span className="flex h-2.5 w-2.5 rounded-full bg-slate-200/30" />
            {item}
          </div>
        ))}
      </div>
      <p className="mt-6 text-lg font-semibold leading-8 text-slate-100">“{response.verdict}”</p>
    </motion.div>
  );
}
