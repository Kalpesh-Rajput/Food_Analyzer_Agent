"use client";

import { motion } from 'framer-motion';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

interface Props {
  testimonial: Testimonial;
  index: number;
}

export default function TestimonialCard({ testimonial, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.1, duration: 0.55 }}
      className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_35px_100px_rgba(255,255,255,0.04)]"
    >
      <p className="text-lg leading-8 text-slate-200">“{testimonial.quote}”</p>
      <div className="mt-8 border-t border-white/10 pt-5">
        <p className="text-base font-semibold text-slate-100">{testimonial.name}</p>
        <p className="mt-1 text-sm text-slate-400">{testimonial.role}</p>
      </div>
    </motion.div>
  );
}
